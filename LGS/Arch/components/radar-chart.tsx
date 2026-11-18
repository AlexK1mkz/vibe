import type { ArchetypeCode } from "@/lib/content";

interface Props {
  /** Проценты 0–100 по каждому архетипу */
  profile: Record<ArchetypeCode, number>;
  names: Record<ArchetypeCode, string>;
  order: readonly ArchetypeCode[];
  highlight: ArchetypeCode[];
  title: string;
  /** Текстовое описание профиля для скринридеров */
  summary: string;
  className?: string;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 92;

function point(index: number, total: number, ratio: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return [CENTER + Math.cos(angle) * RADIUS * ratio, CENTER + Math.sin(angle) * RADIUS * ratio];
}

const polygon = (total: number, ratio: (i: number) => number) =>
  Array.from({ length: total }, (_, i) => point(i, total, ratio(i)).map((n) => n.toFixed(1)).join(",")).join(" ");

/** Диаграмма профиля: шесть осей, подписи читаются на экране 360 px (ТЗ, п. 11) */
export function RadarChart({ profile, names, order, highlight, title, summary, className }: Props) {
  const n = order.length;
  return (
    <figure className={className}>
      <svg viewBox={`-45 0 ${SIZE + 90} ${SIZE}`} role="img" aria-label={`${title}. ${summary}`} className="mx-auto block h-auto w-full max-w-[400px]">
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <polygon key={r} points={polygon(n, () => r)} fill="none" stroke="#dce1d6" strokeWidth={r === 1 ? 1.5 : 1} />
        ))}
        {order.map((code, i) => {
          const [x, y] = point(i, n, 1);
          return <line key={code} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#dce1d6" strokeWidth={1} />;
        })}
        <polygon
          points={polygon(n, (i) => Math.max(profile[order[i]] / 100, 0.04))}
          fill="#d9efad"
          fillOpacity={0.75}
          stroke="#164f46"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {order.map((code, i) => {
          const [x, y] = point(i, n, Math.max(profile[code] / 100, 0.04));
          return <circle key={code} cx={x} cy={y} r={highlight.includes(code) ? 5 : 3.5} fill="#164f46" />;
        })}
        {order.map((code, i) => {
          const [x, y] = point(i, n, 1.2);
          const anchor = Math.abs(x - CENTER) < 6 ? "middle" : x > CENTER ? "start" : "end";
          const dy = i === 0 ? -14 : i === n / 2 ? 12 : 0;
          const strong = highlight.includes(code);
          return (
            <g key={code} aria-hidden="true">
              <text
                x={x}
                y={y + dy}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={15}
                fontWeight={strong ? 800 : 600}
                fill={strong ? "#103d35" : "#5a6961"}
              >
                {names[code]}
              </text>
              <text
                x={x}
                y={y + dy + 17}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={12.5}
                fontWeight={600}
                fill="#5a6961"
              >
                {profile[code]}%
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
