// Результат прямо на карте тела: индекс энергии (кольцо) и рекомендованный чекап.
// Подписи зон с рекомендациями по анализам рисует Hotspots.
import { FlaskConical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { focusById } from '../../content/checkups';
import { zoneColor } from '../body3d/model';
import type { QuizResult } from '../../lib/scoring';

const R = 30;
const C = 2 * Math.PI * R;

/** Плавный счётчик от 0 до значения при первом показе. */
function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(target);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setV(target * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // анимация только при первом показе; дальше значение двигает слайдер «Сейчас ↔ Цель»
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

export default function MapResult({ result, value, goalMode, name }: {
  result: QuizResult; value: number; goalMode: boolean; name?: string;
}) {
  const intro = useCountUp(value);
  const shown = intro < value - 0.5 ? intro : value;
  const focus = focusById(result.checkup);
  const color = zoneColor(shown);

  return (
    <>
      <div className="map-card-in glass absolute left-2 top-2 flex items-center gap-3 rounded-3xl p-2 pr-4 sm:left-3 sm:top-3" data-map-index>
        <div className="relative size-[60px] shrink-0 sm:size-[68px]" aria-hidden="true">
          <svg viewBox="0 0 72 72" className="size-full -rotate-90">
            <circle cx="36" cy="36" r={R} fill="none" stroke="rgb(20 32 27 / 0.1)" strokeWidth="7" />
            <circle
              cx="36" cy="36" r={R} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)}
              style={{ transition: 'stroke .5s ease-out' }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-display text-[20px] font-bold tabular-nums text-ink sm:text-[22px]">
            {Math.round(shown)}
          </span>
        </div>
        <div className="leading-tight">
          <p className="text-[12px] font-medium text-muted">{goalMode ? 'Цель программы' : 'Индекс энергии'}</p>
          <p className="font-display text-[15px] font-bold text-ink">{name ? `${name}, ` : ''}{Math.round(shown)} из 100</p>
        </div>
      </div>

      <div className="map-card-in glass absolute inset-x-2 bottom-2 rounded-3xl p-3 sm:inset-x-3 sm:bottom-3 sm:p-4" style={{ animationDelay: '.5s' }} data-map-reco>
        <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-brand">
          <FlaskConical size={15} aria-hidden="true" /> Рекомендуем начать
        </p>
        <p className="mt-1 font-display text-[15px] font-bold leading-snug text-ink sm:text-[17px]">Чекап «{focus.name}»</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {focus.markers.slice(0, 5).map((m, i) => (
            <li
              key={m}
              className={`rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-medium text-brand-deep ${i > 2 ? 'max-sm:hidden' : ''}`}
            >
              {m}
            </li>
          ))}
          {focus.markers.length > 3 && (
            <li className="rounded-full px-1 py-1 text-[12px] font-medium text-muted sm:hidden">+{focus.markers.length - 3}</li>
          )}
        </ul>
      </div>
    </>
  );
}
