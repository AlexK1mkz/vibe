// SVG-силуэт с теми же зонами, что и 3D-модель. Служит постером до загрузки канваса
// и фолбэком, когда WebGL недоступен, включён prefers-reduced-motion или устройство слабое.
import { useId, useMemo } from 'react';
import {
  COLORS, VIEW_HEIGHT, getModel, yToFrac, zoneColor,
  type BodySex, type Capsule, type Ellipsoid, type ZoneId, type ZoneValues,
} from './model';

const W = 220;
const H = 400;
const S = H / VIEW_HEIGHT;
const sx = (x: number) => W / 2 + x * S;
const sy = (y: number) => H * yToFrac(y);

const torsoPath = (pts: [number, number][]) => {
  const right = pts.map(([r, y]) => `${sx(r).toFixed(1)},${sy(y).toFixed(1)}`);
  const left = [...pts].reverse().map(([r, y]) => `${sx(-r).toFixed(1)},${sy(y).toFixed(1)}`);
  return `M${right.join('L')}L${left.join('L')}Z`;
};

/** Сужающийся сегмент: трапеция и два круга на концах. */
const Limb = ({ c }: { c: Capsule }) => {
  const [x1, y1, x2, y2] = [sx(c.a[0]), sy(c.a[1]), sx(c.b[0]), sy(c.b[1])];
  const r1 = c.r * S;
  const r2 = (c.r2 ?? c.r) * S;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const pts = [
    [x1 + nx * r1, y1 + ny * r1], [x2 + nx * r2, y2 + ny * r2],
    [x2 - nx * r2, y2 - ny * r2], [x1 - nx * r1, y1 - ny * r1],
  ].map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  return (
    <g fill="currentColor">
      <polygon points={pts} />
      <circle cx={x1} cy={y1} r={r1} />
      <circle cx={x2} cy={y2} r={r2} />
    </g>
  );
};
const Blob = ({ e }: { e: Ellipsoid }) => (
  <ellipse cx={sx(e.c[0])} cy={sy(e.c[1])} rx={e.r[0] * S} ry={e.r[1] * S} fill="currentColor" />
);

interface Props {
  sex?: BodySex;
  values?: ZoneValues;
  pulse?: ZoneId | null;
}

export default function BodySvg({ sex = 'n', values = {}, pulse = null }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const m = useMemo(() => getModel(sex), [sex]);

  // Поверхность тела: зона без своего значения наследует значение зоны «кожа».
  const shell = (zone: ZoneId) => {
    const v = values[zone] ?? values.skin;
    return {
      style: { color: v === undefined ? COLORS.brand : zoneColor(v), transition: 'color .5s ease-out' },
      className: pulse === zone ? 'zone-pulse' : undefined,
      filter: `url(#${uid}-glass)`,
    };
  };
  const organ = (zone: 'liver' | 'thyroid') => {
    const v = values[zone];
    const on = v !== undefined || pulse === zone;
    return {
      style: {
        color: v === undefined ? COLORS.now : zoneColor(v),
        opacity: on ? 0.9 : 0,
        transition: 'color .5s ease-out, opacity .5s ease-out',
      },
      className: pulse === zone ? 'zone-pulse' : undefined,
      filter: `url(#${uid}-glow)`,
    };
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        {/* «Стекло»: полупрозрачная заливка и более плотный контур */}
        <filter id={`${uid}-glass`} x="-20%" y="-10%" width="140%" height="120%">
          <feMorphology in="SourceAlpha" operator="erode" radius="2.2" result="inner" />
          <feGaussianBlur in="inner" stdDeviation="3.2" result="innerBlur" />
          <feComposite in="SourceGraphic" in2="innerBlur" operator="out" result="rim" />
          <feComponentTransfer in="SourceGraphic" result="fill">
            <feFuncA type="linear" slope="0.26" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="fill" />
            <feMergeNode in="rim" />
          </feMerge>
        </filter>
        <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <g {...shell('skin')}>
        {m.limbs.map((c, i) => <Limb key={i} c={c} />)}
      </g>
      <g {...shell('pelvis')}><path d={torsoPath(m.torso.pelvis)} fill="currentColor" /></g>
      <g {...shell('abdomen')}><path d={torsoPath(m.torso.abdomen)} fill="currentColor" /></g>
      <g {...shell('chest')}><path d={torsoPath(m.torso.chest)} fill="currentColor" /></g>
      <g {...shell('thyroid')}><Limb c={m.neck} /></g>
      <g {...shell('head')}><Blob e={m.head} /></g>

      <g {...organ('liver')}><Blob e={m.liver} /></g>
      <g {...organ('thyroid')}><Blob e={m.thyroid} /></g>
    </svg>
  );
}
