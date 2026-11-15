// Шаг «Рост и вес»: два ползунка с кнопками ±, ИМТ и норма веса для выбранного роста.
// Пока посетитель не трогал вес, он следует за ростом — так шкала сразу показывает реалистичное значение.
import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import { bodyLimits, type Sex } from '../../content/quiz';
import { BMI_EDGES, bmi, bmiBand, massAt, type BmiBand } from '../../lib/scoring';

export const BMI_LOOK: Record<BmiBand, { label: string; color: string }> = {
  low: { label: 'ниже нормы', color: '#3E8FCB' },
  norm: { label: 'в норме', color: '#248E68' },
  over: { label: 'выше нормы', color: '#C98A1E' },
  high: { label: 'заметно выше нормы', color: '#D9783F' },
  veryHigh: { label: 'значительно выше нормы', color: '#C2553A' },
};
const BAND_ORDER: BmiBand[] = ['low', 'norm', 'over', 'high', 'veryHigh'];

const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface Props {
  sex?: Sex;
  height?: number;
  mass?: number;
  onChange: (height: number, mass: number) => void;
}

function Metric({
  id, label, unit, value, min, max, onChange, trackStyle,
}: {
  id: string; label: string; unit: string; value: number; min: number; max: number;
  onChange: (v: number) => void; trackStyle?: CSSProperties;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="rounded-3xl bg-bg p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-medium text-muted">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button" aria-label={`${label}: меньше`} onClick={() => onChange(clamp(value - 1, min, max))}
            className="grid size-10 place-items-center rounded-full border-[1.5px] border-line bg-surface text-ink transition hover:border-brand hover:text-brand active:scale-95"
          >
            <Minus size={18} aria-hidden="true" />
          </button>
          <output htmlFor={id} className="min-w-[5.5ch] text-center font-display text-[32px] font-bold leading-none tabular-nums">
            {value}<span className="ml-1 text-base font-semibold text-muted">{unit}</span>
          </output>
          <button
            type="button" aria-label={`${label}: больше`} onClick={() => onChange(clamp(value + 1, min, max))}
            className="grid size-10 place-items-center rounded-full border-[1.5px] border-line bg-surface text-ink transition hover:border-brand hover:text-brand active:scale-95"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} ${unit}`}
        className="metric-slider mt-3"
        style={{ '--fill': `${fill}%`, ...trackStyle } as CSSProperties}
      />
      <div className="flex justify-between text-xs text-muted" aria-hidden="true">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

export default function BodyMetrics({ sex, height, mass, onChange }: Props) {
  const def = bodyLimits.defaults[sex ?? 'f'];
  const h = height ?? def.height;
  const m = mass ?? def.mass;
  const massTouched = useRef(mass !== undefined && height !== undefined && (height !== def.height || mass !== def.mass));

  // значения сразу попадают в ответы: фигура и зоны реагируют, пока посетитель двигает ползунки
  useEffect(() => {
    if (height === undefined || mass === undefined) onChange(h, m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // шкала веса зависит от роста: от ИМТ 15 до ИМТ 50 — так зона нормы занимает заметную часть шкалы
  const range = (height: number) => ({
    min: Math.max(bodyLimits.mass.min, Math.floor(massAt(15, height))),
    max: Math.min(bodyLimits.mass.max, Math.ceil(massAt(50, height))),
  });
  const { min: wMin, max: wMax } = range(h);
  const value = bmi(h, m)!;
  const band = bmiBand(value);
  const look = BMI_LOOK[band];
  const normLow = Math.round(massAt(BMI_EDGES[0], h));
  const normHigh = Math.round(massAt(BMI_EDGES[1], h) - 0.5);

  // цветные зоны ИМТ на шкале веса пересчитываются для каждого роста
  const pos = (kg: number) => clamp(((kg - wMin) / (wMax - wMin)) * 100, 0, 100);
  const stops = BMI_EDGES.map((e) => pos(massAt(e, h)));
  const colors = BAND_ORDER.map((b) => BMI_LOOK[b].color);
  const segments = colors.map((c, i) => `${c} ${i ? stops[i - 1] : 0}% ${i < stops.length ? stops[i] : 100}%`);
  const track: CSSProperties = { '--track': `linear-gradient(90deg, ${segments.join(', ')})` } as CSSProperties;

  function setHeight(next: number) {
    // пока вес не трогали, держим тот же ИМТ — вес «едет» вместе с ростом
    const r = range(next);
    const nextMass = clamp(massTouched.current ? m : Math.round(massAt(value, next)), r.min, r.max);
    onChange(next, nextMass);
  }
  function setMass(next: number) {
    massTouched.current = true;
    onChange(h, next);
  }

  return (
    <div className="mt-5 grid gap-3 lg:mt-7">
      <Metric id="q-height" label="Рост" unit="см" value={h} min={bodyLimits.height.min} max={bodyLimits.height.max} onChange={setHeight} />
      <Metric id="q-mass" label="Вес" unit="кг" value={m} min={wMin} max={wMax} onChange={setMass} trackStyle={track} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl border-[1.5px] border-line px-4 py-3 sm:px-5" aria-live="polite">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white transition-colors duration-300"
          style={{ background: look.color }}
        >
          ИМТ {fmt(value)} · {look.label}
        </span>
        <span className="text-sm text-muted">
          Норма для роста {h} см: <b className="text-ink">{normLow}–{normHigh} кг</b>
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        ИМТ — ориентир, а не диагноз: он не различает мышцы и жир. Точный состав тела покажет InBody на встрече.
      </p>
    </div>
  );
}
