// Первичный тест + модель тела (ТЗ, раздел 6). Один вопрос на экран, затем контакты
// (имя, фамилия, телефон) — после них результат на карте тела и переход в WhatsApp.
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import BodyView from '../body3d/BodyView';
import { questions, type Goal, type QuestionId } from '../../content/quiz';
import { ru } from '../../i18n/ru';
import { track } from '../../lib/analytics';
import { bmi, computeScales, score, zoneValues } from '../../lib/scoring';
import BodyMetrics from './BodyMetrics';
import ContactStep from './ContactStep';
import MapResult from './MapResult';
import Result, { useHotspots } from './Result';
import { useQuiz } from './store';

declare global {
  interface Window {
    __zrGoal?: Goal;
  }
}

const total = questions.length;
/** Вопросы + шаг с контактами. */
const steps = total + 1;

export default function QuizApp() {
  const { answers, step, phase, t, contact, setAnswer, setBody, next, back, startWithGoal } = useQuiz();
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const advance = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Карточки «Узнаёте себя?» запускают тест с предвыбранной целью
  useEffect(() => {
    const apply = (goal?: Goal) => goal && startWithGoal(goal);
    apply(window.__zrGoal);
    window.__zrGoal = undefined;
    const onGoal = (e: Event) => apply((e as CustomEvent<Goal>).detail);
    window.addEventListener('zr:quiz-goal', onGoal);
    return () => window.removeEventListener('zr:quiz-goal', onGoal);
  }, [startWithGoal]);

  const result = useMemo(() => (phase === 'result' ? score(answers) : null), [phase, answers]);
  const values = useMemo(() => {
    if (result) return zoneValues(result.scales, { t, liver: result.flags.liver });
    return zoneValues(computeScales(answers), { liver: answers.symptoms?.includes('liver') });
  }, [result, answers, t]);
  const hotspots = useHotspots(result, t);
  const build = bmi(answers.height, answers.mass);

  useEffect(() => {
    if (!result) return;
    track('quiz_complete', { direction: result.direction, index: result.index });
    root.current?.scrollIntoView({ block: 'start' });
  }, [result]);

  useEffect(() => {
    if (phase === 'contact') track('quiz_contact_step');
  }, [phase]);

  const q = questions[step];
  const current = answers[q.id];
  const selected: string[] = Array.isArray(current) ? current : typeof current === 'string' ? [current] : [];
  const isBody = q.kind === 'body';
  const canNext = isBody || selected.length > 0;

  function trackStep() {
    if (!started.current) {
      started.current = true;
      track('quiz_start');
    }
    track(`quiz_step_${step + 1}`, { question: q.id });
  }

  function goNext() {
    clearTimeout(advance.current);
    trackStep();
    next();
  }

  function choose(id: QuestionId, option: { id: string; exclusive?: boolean }) {
    if (!q.multi) {
      setAnswer(id, option.id);
      clearTimeout(advance.current);
      advance.current = setTimeout(goNext, 320); // короткая пауза, чтобы выбор было видно
      return;
    }
    let nextSel: string[];
    if (option.exclusive) nextSel = selected.includes(option.id) ? [] : [option.id];
    else {
      const rest = selected.filter((s) => s !== option.id && !q.options.find((o) => o.id === s)?.exclusive);
      nextSel = selected.includes(option.id) ? rest : [...rest, option.id];
    }
    setAnswer(id, nextSel);
  }

  const progress = phase === 'quiz' ? step / steps : total / steps;
  const modelHeight =
    phase === 'result'
      ? 'h-[72vh] min-h-[500px] max-h-[680px] lg:h-[720px] lg:max-h-none'
      : 'h-[30vh] min-h-[220px] lg:h-[640px]';

  return (
    <div
      ref={root}
      data-quiz-phase={phase}
      className={`grid scroll-mt-24 items-start gap-5 lg:gap-10 ${
        // на результате карте тела нужно больше места: рядом с зонами стоят рекомендации
        phase === 'result' ? 'lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'
      }`}
    >
      <div className="lg:sticky lg:top-24">
        <BodyView
          sex={answers.sex ?? 'n'}
          values={values}
          pulse={phase === 'quiz' ? (q.zone ?? null) : null}
          hotspots={hotspots}
          sway={phase === 'result'}
          build={build}
          reserve={result ? { top: 84, bottom: 112 } : undefined}
          label={ru.quiz.modelAlt}
          className={modelHeight}
        >
          {result && (
            <MapResult
              result={result}
              value={result.index + (result.goalIndex - result.index) * t}
              goalMode={t >= 0.5}
              name={contact?.firstName}
            />
          )}
        </BodyView>
      </div>

      {result ? (
        <Result answers={answers} result={result} />
      ) : phase === 'contact' ? (
        <ContactStep answers={answers} />
      ) : (
        <div className="card p-5 sm:p-8 lg:min-h-[620px] lg:p-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { clearTimeout(advance.current); back(); }}
              disabled={step === 0}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-0"
              aria-label={ru.quiz.back}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <div className="flex-1">
              <p className="flex justify-between text-sm font-medium text-muted" aria-live="polite">
                <span>{ru.quiz.step(step + 1, total)}</span>
                <span className="tabular-nums">{Math.round(progress * 100)}%</span>
              </p>
              <div
                className="progress-track mt-2"
                role="progressbar" aria-valuemin={0} aria-valuemax={steps} aria-valuenow={step}
                aria-label={ru.quiz.step(step + 1, total)}
              >
                <div className="progress-fill" style={{ width: `${Math.max(4, progress * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* key перезапускает CSS-анимацию появления на каждом вопросе */}
          <fieldset key={q.id} className="step-in mt-6 lg:mt-10">
            <legend className="h3 !text-[clamp(22px,2.6vw,30px)]">{q.title}</legend>
            {q.hint && <p className="mt-2 text-muted">{q.hint}</p>}
            {isBody ? (
              <BodyMetrics
                sex={answers.sex}
                height={answers.height}
                mass={answers.mass}
                onChange={(h, m) => setBody(h, m)}
              />
            ) : (
              <div className="mt-5 grid gap-2.5 lg:mt-7" role={q.multi ? 'group' : 'radiogroup'}>
                {q.options.map((o, i) => {
                  const on = selected.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role={q.multi ? 'checkbox' : 'radio'}
                      aria-checked={on}
                      onClick={() => choose(q.id, o)}
                      style={{ '--i': i } as CSSProperties}
                      className={`quiz-option flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border-[1.5px] px-5 py-3 text-left font-medium ${
                        on ? 'is-on border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface'
                      }`}
                    >
                      {o.label}
                      <span
                        className={`grid size-6 shrink-0 place-items-center border-[1.5px] transition-colors ${
                          q.multi ? 'rounded-md' : 'rounded-full'
                        } ${on ? 'border-brand bg-brand text-white' : 'border-line'}`}
                      >
                        {on && <Check size={14} strokeWidth={3} className="check-pop" aria-hidden="true" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {(q.multi || isBody || selected.length > 0) && (
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                <button
                  type="button"
                  className="btn btn-primary w-full sm:w-auto"
                  disabled={!canNext}
                  style={!canNext ? { opacity: 0.45 } : undefined}
                  onClick={goNext}
                >
                  {ru.quiz.next}
                </button>
                {isBody && (
                  <button
                    type="button"
                    className="min-h-11 font-medium text-muted underline-offset-4 hover:underline max-sm:w-full"
                    onClick={() => { setBody(undefined, undefined); goNext(); }}
                  >
                    {ru.quiz.skip}
                  </button>
                )}
              </div>
            )}
          </fieldset>
        </div>
      )}
    </div>
  );
}
