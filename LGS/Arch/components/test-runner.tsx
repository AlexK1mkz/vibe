"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestOption, TestQuestion } from "@/lib/content";
import { getUtm, LAST_RESULT_KEY, storageGet, storageRemove, storageSet, TEST_STATE_KEY, track } from "@/lib/client";

interface Strings {
  progress: string;
  progressLabel: string;
  behaviorPrompt: string;
  resumed: string;
  restart: string;
  calculating: string;
  submitError: string;
  haveResult: string;
  openResult: string;
  honeypotLabel: string;
  charsLeft: string;
  back: string;
  next: string;
  retry: string;
}

interface SavedState {
  version: number;
  index: number;
  answers: Record<string, string>;
  goalText: string;
  seed: number;
}

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, key: string) => String(values[key] ?? m));

/** Детерминированное перемешивание: порядок вариантов не меняется при возврате назад и перезагрузке */
function shuffled(options: TestOption[], seed: number, salt: string): TestOption[] {
  let state = seed;
  for (const ch of salt) state = (state * 31 + ch.charCodeAt(0)) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const list = [...options];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function TestRunner({
  questions,
  version,
  calcMs,
  strings,
}: {
  questions: TestQuestion[];
  version: number;
  calcMs: number;
  strings: Strings;
}) {
  const router = useRouter();
  const total = questions.length;
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [goalText, setGoalText] = useState("");
  const [seed, setSeed] = useState(1);
  const [resumed, setResumed] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [phase, setPhase] = useState<"quiz" | "calc" | "error">("quiz");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  // Незавершённый тест продолжается с места остановки (ТЗ, п. 8)
  useEffect(() => {
    let restored = false;
    try {
      const saved = JSON.parse(storageGet(TEST_STATE_KEY) || "null") as SavedState | null;
      if (saved && saved.version === version && Object.keys(saved.answers).length > 0) {
        const valid = Object.fromEntries(
          Object.entries(saved.answers).filter(([qid, oid]) =>
            questions.some((q) => q.id === qid && q.options.some((o) => o.id === oid)),
          ),
        );
        const firstOpen = questions.findIndex((q) => !valid[q.id]);
        setAnswers(valid);
        setGoalText(saved.goalText || "");
        setSeed(saved.seed || 1);
        setIndex(Math.min(saved.index, firstOpen === -1 ? total - 1 : firstOpen));
        setResumed(true);
        restored = true;
      }
    } catch {
      /* повреждённое состояние: начинаем заново */
    }
    if (!restored) {
      setSeed(Math.floor(Math.random() * 1e9) + 1);
      setLastResult(storageGet(LAST_RESULT_KEY));
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted || phase !== "quiz") return;
    if (Object.keys(answers).length === 0) return;
    storageSet(TEST_STATE_KEY, JSON.stringify({ version, index, answers, goalText, seed } satisfies SavedState));
  }, [mounted, phase, version, index, answers, goalText, seed]);

  useEffect(() => {
    if (mounted && phase === "quiz") headingRef.current?.focus({ preventScroll: true });
  }, [index, mounted, phase]);

  const question = questions[index];
  const options = useMemo(
    () => (question.block === "B" ? shuffled(question.options, seed, question.id) : question.options),
    [question, seed],
  );

  const submit = useCallback(
    async (finalAnswers: Record<string, string>, text: string) => {
      if (busy.current) return;
      busy.current = true;
      setPhase("calc");
      const started = Date.now();
      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: finalAnswers,
            goalText: text,
            utm: getUtm(),
            website: honeypotRef.current?.value || "",
          }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { publicId: string };
        const wait = calcMs - (Date.now() - started);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        storageRemove(TEST_STATE_KEY);
        storageSet(LAST_RESULT_KEY, data.publicId);
        router.push(`/result/${data.publicId}`);
      } catch {
        busy.current = false;
        setPhase("error");
      }
    },
    [calcMs, router],
  );

  const goNext = useCallback(
    (nextAnswers: Record<string, string>) => {
      if (index + 1 >= total) void submit(nextAnswers, goalText);
      else setIndex(index + 1);
    },
    [index, total, submit, goalText],
  );

  const choose = (option: TestOption) => {
    if (phase !== "quiz") return;
    const nextAnswers = { ...answers, [question.id]: option.id };
    setAnswers(nextAnswers);
    setResumed(false);
    setLastResult(null);
    const n = index + 1;
    if (n === 1) track("test_start", {}, { onceKey: `start_${seed}` });
    track(`test_question_${n}`, { question: question.id }, { onceKey: `q${n}_${seed}` });
    // Вопрос с полем «своими словами» ждёт кнопку «Дальше», остальные переходят по нажатию
    if (!question.freeText) window.setTimeout(() => goNext(nextAnswers), 160);
  };

  const restart = () => {
    storageRemove(TEST_STATE_KEY);
    setAnswers({});
    setGoalText("");
    setIndex(0);
    setResumed(false);
    setSeed(Math.floor(Math.random() * 1e9) + 1);
  };

  if (!mounted) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (phase === "calc") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center" role="status" aria-live="polite">
        <div className="flex gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full bg-accent"
              style={{ animation: `pulse-dot 0.9s ${i * 0.18}s infinite` }}
            />
          ))}
        </div>
        <p className="mt-6 text-2xl font-bold">{strings.calculating}</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center" role="alert">
        <p className="max-w-sm text-lg font-semibold">{strings.submitError}</p>
        <button type="button" className="btn btn-primary mt-6" onClick={() => void submit(answers, goalText)}>
          {strings.retry}
        </button>
      </div>
    );
  }

  const n = index + 1;
  const selected = answers[question.id];
  const percent = Math.round((index / total) * 100);

  return (
    <div className="pb-10">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="-ml-2 min-h-11 rounded-lg px-2 text-sm font-semibold text-muted disabled:invisible"
        >
          ← {strings.back}
        </button>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index}
          aria-label={fill(strings.progressLabel, { n, total })}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <p className="min-w-16 text-right text-sm font-bold tabular-nums" data-testid="progress">
          {fill(strings.progress, { n, total })}
        </p>
      </div>

      {resumed && (
        <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          {strings.resumed}{" "}
          <button type="button" onClick={restart} className="font-bold underline">
            {strings.restart}
          </button>
        </p>
      )}
      {lastResult && index === 0 && (
        <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          {strings.haveResult}{" "}
          <Link href={`/result/${lastResult}`} className="font-bold underline">
            {strings.openResult}
          </Link>
        </p>
      )}

      <div key={question.id} className="fade-up mt-8">
        {question.block === "B" && <p className="eyebrow mb-3">{strings.behaviorPrompt}</p>}
        <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none sm:text-3xl">
          {question.text}
        </h1>
        {question.hint && <p className="mt-2 text-sm text-muted">{question.hint}</p>}

        <ul className="mt-6 grid gap-3" data-testid="options">
          {options.map((option) => {
            const active = selected === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => choose(option)}
                  aria-pressed={active}
                  data-option={option.id}
                  className={`flex min-h-16 w-full items-center rounded-2xl border-[1.5px] px-5 py-4 text-left text-[17px] font-semibold leading-snug transition-colors ${
                    active ? "border-accent bg-accent text-on-accent" : "border-line bg-surface hover:border-accent"
                  }`}
                >
                  {option.text}
                </button>
              </li>
            );
          })}
        </ul>

        {question.freeText && (
          <div className="mt-6">
            <label htmlFor="goal-text" className="text-sm font-semibold">
              {question.freeText.label}
            </label>
            <textarea
              id="goal-text"
              className="field mt-2"
              rows={2}
              maxLength={question.freeText.maxLength}
              placeholder={question.freeText.placeholder}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              aria-describedby="goal-text-left"
            />
            <p id="goal-text-left" className="mt-1 text-xs text-muted">
              {fill(strings.charsLeft, { n: question.freeText.maxLength - goalText.length })}
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4 w-full"
              disabled={!selected}
              onClick={() => goNext(answers)}
            >
              {strings.next} <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>

      {/* Honeypot: скрытое поле для защиты от ботов */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          {strings.honeypotLabel}
          <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </div>
  );
}
