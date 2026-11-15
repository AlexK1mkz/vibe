// Подписи зон поверх фигуры: HTML-слой, доступен с клавиатуры и скринридеру.
import { useState, type ReactNode } from 'react';
import { zoneAnchor, type Figure } from './figure';
import { zoneColor, type ZoneId } from './model';

export interface Hotspot {
  id: string;
  zone: ZoneId;
  label: string;
  /** Значение, которое показывается сейчас (с учётом слайдера). */
  value: number;
  /** Текст для скринридера: «Сон: сейчас 50 из 100, цель программы 82». */
  description: string;
  icon: ReactNode;
  /** Рекомендация: что посмотреть в анализах. На узких экранах раскрывается по нажатию. */
  tip?: string;
}

/** Прямоугольник фигуры внутри контейнера, px. */
export interface Rect { left: number; top: number; width: number; height: number }

const MIN_GAP = 54;
const LABEL_W = 128;

interface Props {
  items: Hotspot[];
  figure: Figure;
  rect: Rect;
  containerWidth: number;
  containerHeight: number;
  onFocus?: (zone: ZoneId | null) => void;
  /** Свободная по высоте полоса для подписей, px (сверху и снизу могут стоять карточки). */
  band?: { top: number; bottom: number };
}

export default function Hotspots({ items, figure, rect, containerWidth, containerHeight, onFocus, band }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rect.width || !items.length) return null;
  const cx = rect.left + rect.width / 2;
  // широкий контейнер — подписи с рекомендацией видны сразу; узкий — раскрываются по нажатию
  const wide = containerWidth >= 560;
  const labelW = wide ? 196 : LABEL_W;
  // подписи стоят сбоку от фигуры, но не выходят за контейнер
  const edge = Math.max(rect.width * 0.5, 20);
  const gap = wide ? MIN_GAP + 26 : MIN_GAP;
  const minY = (band?.top ?? 0) + 28;
  const maxY = containerHeight - (band?.bottom ?? 0) - 28;
  const clampX = (side: 'left' | 'right', x: number) =>
    side === 'left' ? Math.max(labelW + 6, x) : Math.min(containerWidth - labelW - 6, x);

  const lastY = { left: -Infinity, right: -Infinity };
  const placed = items
    .map((h) => {
      const a = zoneAnchor(figure, h.zone);
      return { ...h, ax: rect.left + a.x * rect.width, ay: rect.top + a.y * rect.height };
    })
    .sort((a, b) => a.ay - b.ay)
    .map((h, i) => {
      // печень — справа у человека, значит слева для зрителя
      const side: 'left' | 'right' = h.zone === 'liver' || h.zone === 'skin' ? 'left' : i % 2 === 0 ? 'right' : 'left';
      const y = Math.min(maxY, Math.max(minY, h.ay, lastY[side] + gap));
      lastY[side] = y;
      return { ...h, side, y, lx: clampX(side, cx + (side === 'left' ? -edge : edge)) };
    });

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {placed.map((h, i) => (
          <g key={h.id} stroke={zoneColor(h.value)} fill={zoneColor(h.value)} className="hotspot-line" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
            <line x1={h.ax} y1={h.ay} x2={h.lx} y2={h.y} strokeWidth="1.5" strokeDasharray="2 4" strokeLinecap="round" />
            <circle cx={h.ax} cy={h.ay} r="9" opacity="0.3" stroke="none" className="hotspot-halo" />
            <circle cx={h.ax} cy={h.ay} r="4.5" stroke="#fff" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
      <ul className="contents">
        {placed.map((h, i) => {
          const showTip = !!h.tip && (wide || open === h.id);
          return (
            <li key={h.id} className="contents">
              <button
                type="button"
                aria-label={`${h.description}${h.tip ? `. ${h.tip}` : ''}`}
                aria-expanded={wide || !h.tip ? undefined : open === h.id}
                onFocus={() => onFocus?.(h.zone)}
                onBlur={() => onFocus?.(null)}
                onPointerEnter={() => onFocus?.(h.zone)}
                onPointerLeave={() => onFocus?.(null)}
                onClick={() => setOpen((v) => (v === h.id ? null : h.id))}
                className={`glass hotspot-in pointer-events-auto absolute flex -translate-y-1/2 items-center gap-2 rounded-2xl py-1.5 pl-1.5 pr-3 text-left ${open === h.id ? 'z-10' : ''}`}
                style={{
                  ...(h.side === 'left' ? { right: containerWidth - h.lx, top: h.y } : { left: h.lx, top: h.y }),
                  animationDelay: `${0.3 + i * 0.12}s`,
                  maxWidth: showTip ? 196 : undefined,
                }}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center self-start rounded-full text-white transition-colors duration-500"
                  style={{ background: zoneColor(h.value) }}
                >
                  {h.icon}
                </span>
                <span className="leading-tight">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[12px] font-medium text-muted">{h.label}</span>
                    <span className="font-display text-[15px] font-bold tabular-nums text-ink">{Math.round(h.value)}</span>
                  </span>
                  {showTip && (
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-ink/80">
                      <span className="font-semibold text-brand-deep">Анализы:</span> {h.tip}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
