// Экран результата (ТЗ 6.3): индекс, шкалы «Сейчас» и «Цель программы», слайдер, рекомендация, CTA.
import { Activity, Brain, CheckCircle2, Hand, Moon, RotateCcw, Scale, Sparkles, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Hotspot } from '../body3d/Hotspots';
import { focusById } from '../../content/checkups';
import { directionById } from '../../content/directions';
import { scaleTips } from '../../content/recommendations';
import type { Answers } from '../../content/quiz';
import { site } from '../../content/site';
import { ru } from '../../i18n/ru';
import { track } from '../../lib/analytics';
import {
  SCALE_IDS, SCALE_ZONE, interpretation, isMaintained,
  type QuizResult, type ScaleId,
} from '../../lib/scoring';
import { resultWaLink, scaleNames } from '../../lib/whatsapp';
import { useQuiz } from './store';

const t = ru.result;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const ICONS: Record<ScaleId, ReactNode> = {
  energy: <Zap size={16} aria-hidden="true" />,
  sleep: <Moon size={16} aria-hidden="true" />,
  weight: <Scale size={16} aria-hidden="true" />,
  hormones: <Activity size={16} aria-hidden="true" />,
  skin: <Sparkles size={16} aria-hidden="true" />,
  stress: <Brain size={16} aria-hidden="true" />,
};

/** Подписи на модели: 2–4 зоны, которым нужно внимание. */
export function useHotspots(result: QuizResult | null, k: number): Hotspot[] | undefined {
  return useMemo(() => {
    if (!result) return undefined;
    // «сон» и «стресс» живут в одной зоне — на модели оставляем более слабую шкалу
    const seen = new Set<string>();
    return result.attention
      .filter((id) => {
        const zone = SCALE_ZONE[id];
        if (seen.has(zone)) return false;
        seen.add(zone);
        return true;
      })
      .map((id) => ({
        id,
        zone: SCALE_ZONE[id],
        label: scaleNames[id].short,
        value: lerp(result.scales[id], result.goals[id], k),
        description: `${scaleNames[id].full}: сейчас ${result.scales[id]} из 100, цель программы ${result.goals[id]}`,
        icon: ICONS[id],
        tip: scaleTips[id].check,
      }));
  }, [result, k]);
}

function Bar({ label, value, tone, note, dim }: { label: string; value: number; tone: 'now' | 'goal'; note?: string; dim?: number }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr_2.25rem] items-center gap-3 text-sm sm:grid-cols-[9.5rem_1fr_2.25rem]">
      <span className="text-muted">{label}</span>
      <span className="h-2.5 overflow-hidden rounded-full bg-bg">
        <span
          className={`block h-full rounded-full ${tone === 'now' ? 'bg-now' : 'bg-goal'}`}
          style={{ width: `${value}%`, opacity: dim ?? 1 }}
        />
      </span>
      <span className="text-right font-display font-bold tabular-nums">{note ? '' : Math.round(value)}</span>
      {note && <span className="col-span-3 -mt-2 text-right text-xs text-muted">{note}</span>}
    </div>
  );
}

export default function Result({ answers, result }: { answers: Answers; result: QuizResult }) {
  const { t: k, setT, restart, contact } = useQuiz();
  const [hint, setHint] = useState(false);
  const touched = useRef(false);
  const lastMode = useRef<'now' | 'goal'>('now');
  const raf = useRef(0);

  // Через 1,5 с — мягкая подсказка потянуть слайдер
  useEffect(() => {
    const id = setTimeout(() => !touched.current && setHint(true), 1500);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  function update(value: number) {
    touched.current = true;
    setHint(false);
    setT(value);
    const mode = value >= 0.5 ? 'goal' : 'now';
    if (mode !== lastMode.current) {
      lastMode.current = mode;
      track('result_toggle', { mode });
    }
  }

  function animateTo(target: number) {
    cancelAnimationFrame(raf.current);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return update(target);
    const from = useQuiz.getState().t;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / 600);
      update(lerp(from, target, 1 - (1 - p) ** 3));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  const focus = focusById(result.checkup);
  const direction = directionById(result.direction);
  const seg = result.segment;
  const name = contact ? `${contact.firstName} ${contact.lastName}` : undefined;
  const href = resultWaLink(answers, result, { name });
  const primary = { label: seg === 'D' ? t.getMemo : seg === 'C' ? t.bookCheckup : t.discuss, href };
  const index = Math.round(lerp(result.index, result.goalIndex, k));

  return (
    <div className="grid gap-5" data-quiz-result>
      <div className="card p-5 sm:p-8">
        <p className="eyebrow">Результат теста</p>
        <h3 className="h2 mt-3 !text-[clamp(26px,3.2vw,38px)]">{t.title(result.index)}</h3>
        <p className="mt-3 text-muted">{interpretation(result.index)}</p>

        <div className="mt-6 rounded-3xl bg-bg p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{k < 0.5 ? t.now : t.goal}</p>
              <p className="font-display text-5xl font-bold leading-none tabular-nums" aria-hidden="true">{index}</p>
            </div>
            <p className="text-right text-sm text-muted">
              {t.now}: <b className="text-ink">{result.index}</b><br />
              {t.goalIndex}: <b className="text-ink">{result.goalIndex}</b>
            </p>
          </div>
          <div className={hint ? 'nudge' : undefined}>
            <input
              type="range" min={0} max={100} step={1}
              value={Math.round(k * 100)}
              onChange={(e) => update(Number(e.target.value) / 100)}
              className="mode-slider mt-2"
              aria-label={t.sliderLabel}
              aria-valuetext={k < 0.5 ? t.now : t.goal}
              data-mode-slider
            />
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <button type="button" className="rounded-full px-3 py-1.5 text-[#8A5A0B] hover:bg-now-soft" onClick={() => animateTo(0)}>
              {t.now}
            </button>
            <button type="button" className="rounded-full px-3 py-1.5 text-brand-deep hover:bg-goal-soft" onClick={() => animateTo(1)}>
              {t.goal}
            </button>
          </div>
          <p className={`mt-1 flex items-center gap-2 text-sm text-muted transition-opacity duration-500 ${hint ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!hint}>
            <Hand size={16} aria-hidden="true" /> {t.sliderHint}
          </p>
        </div>

        <h4 className="mt-7 font-display text-lg font-bold">{t.scalesTitle}</h4>
        <ul className="mt-4 grid gap-5">
          {SCALE_IDS.map((id) => {
            const cur = result.scales[id];
            const goal = result.goals[id];
            const keep = isMaintained(cur);
            return (
              <li key={id}>
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <span className="text-brand">{ICONS[id]}</span>
                  {scaleNames[id].full}
                  <span className="sr-only">
                    : сейчас {cur} из 100, {keep ? t.maintain : `цель программы ${goal}`}
                  </span>
                </p>
                <div className="grid gap-1.5" aria-hidden="true">
                  <Bar label={t.now} value={cur} tone="now" />
                  <Bar
                    label={t.goal}
                    value={keep ? cur : lerp(cur, goal, k)}
                    tone="goal"
                    dim={keep ? 1 : 0.35 + 0.65 * k}
                    note={keep ? t.maintain : undefined}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-muted">
          {t.selfNote} {t.goalNote}
        </p>
      </div>

      <div className="card p-5 sm:p-8">
        <h4 className="h3">{t.startTitle}</h4>
        <ul className="mt-4 grid gap-2.5" data-result-reco>
          {result.attention.map((id) => (
            <li key={id} className="flex items-start gap-3 rounded-2xl border border-line p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-now-soft text-[#8A5A0B]">{ICONS[id]}</span>
              <span className="text-sm leading-snug">
                <b className="block text-[15px] text-ink">{scaleNames[id].full} · {result.scales[id]} из 100</b>
                <span className="text-muted">{scaleTips[id].tip}. Анализы: {scaleTips[id].check}.</span>
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-bg p-4">
            <dt className="text-sm text-muted">{t.checkup}</dt>
            <dd className="mt-1 font-display text-lg font-bold">«{focus.name}»</dd>
            <dd className="mt-1 text-sm text-muted">{focus.markers.join(', ')}</dd>
          </div>
          <div className="rounded-2xl bg-bg p-4">
            <dt className="text-sm text-muted">{t.direction}</dt>
            <dd className="mt-1 font-display text-lg font-bold">{direction.title}</dd>
            <dd className="mt-1 text-sm text-muted">{direction.forWhom}</dd>
          </div>
        </dl>
        <ul className="mt-4 grid gap-2">
          {direction.includes.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-goal" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">{answers.lastTests === 'year' ? t.testsRecent : t.testsOld}</p>

        {contact && (
          <p role="status" className="mt-5 flex items-start gap-3 rounded-2xl bg-goal-soft px-4 py-3 text-sm text-brand-deep">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {contact.firstName}, результат у помощника врача. {seg === 'D' ? t.memoNote : `Помощник врача напишет в WhatsApp ${site.sla}.`}
            </span>
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {seg === 'D' && (
            <a
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand underline-offset-4 hover:underline"
              href={resultWaLink(answers, result, { discuss: true, name })} target="_blank" rel="noopener"
              onClick={() => track('lead_whatsapp', { source: 'result_discuss', segment: seg })}
            >
              {t.discuss}
            </a>
          )}
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 font-medium text-muted underline-offset-4 hover:underline"
            onClick={restart}
          >
            <RotateCcw size={16} aria-hidden="true" /> {ru.quiz.restart}
          </button>
        </div>

        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          {t.selfNote} {site.disclaimer} Лицензия {site.legal.license}.
        </p>
      </div>
      {/* Основная кнопка прилипает к низу экрана, пока результат на виду */}
      <div className="sticky bottom-3 z-10">
        <a
          className="btn btn-primary w-full shadow-float"
          href={primary.href} target="_blank" rel="noopener"
          data-result-cta
          onClick={() => track('lead_whatsapp', { source: 'result', segment: seg })}
        >
          {primary.label}
        </a>
      </div>
    </div>
  );
}
