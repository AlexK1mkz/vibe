// Единое описание тела-манекена: из него строятся и 3D-модель (BodyCanvas), и SVG-фолбэк (BodySvg).
// Это заглушка до получения лицензионной GLB-модели (ТЗ 6.4). Единицы — метры, рост ≈ 1,74.

export type ZoneId = 'head' | 'thyroid' | 'chest' | 'liver' | 'abdomen' | 'pelvis' | 'skin';
export type BodySex = 'f' | 'm' | 'n';
/** Значение шкалы 0–100 для подсвеченной зоны; зоны без значения остаются нейтральными. */
export type ZoneValues = Partial<Record<ZoneId, number>>;

export type Vec3 = [number, number, number];
/** Сегмент конечности: от точки a (радиус r) к точке b (радиус r2, по умолчанию r). */
export interface Capsule { a: Vec3; b: Vec3; r: number; r2?: number }
export interface Ellipsoid { c: Vec3; r: Vec3 }

export interface BodyModel {
  /** Профиль торса для тела вращения: [радиус, высота], снизу вверх. */
  torso: Record<'pelvis' | 'abdomen' | 'chest', [number, number][]>;
  /** Сплющивание торса по глубине. */
  depth: number;
  head: Ellipsoid;
  neck: Capsule;
  limbs: Capsule[];
  liver: Ellipsoid;
  thyroid: Ellipsoid;
}

export const BODY_HEIGHT = 1.74;
/** Видимая высота сцены: тело занимает 88 % кадра. */
export const VIEW_HEIGHT = BODY_HEIGHT / 0.88;
export const CAMERA_FOV = 30;
export const CAMERA_DISTANCE = VIEW_HEIGHT / (2 * Math.tan((CAMERA_FOV * Math.PI) / 360));

const PROFILE: Record<'f' | 'm', [number, number][]> = {
  f: [
    [0.03, 0.8], [0.12, 0.815], [0.168, 0.86], [0.178, 0.92], [0.165, 0.98],
    [0.137, 1.05], [0.126, 1.1], [0.134, 1.18],
    [0.153, 1.27], [0.163, 1.35], [0.15, 1.415], [0.075, 1.452], [0.045, 1.47],
  ],
  m: [
    [0.03, 0.8], [0.115, 0.815], [0.155, 0.86], [0.162, 0.92], [0.157, 0.98],
    [0.15, 1.05], [0.148, 1.1], [0.158, 1.18],
    [0.18, 1.27], [0.196, 1.35], [0.185, 1.415], [0.085, 1.452], [0.05, 1.47],
  ],
};

const mix = (a: number, b: number, t = 0.5) => a + (b - a) * t;

export function getModel(sex: BodySex): BodyModel {
  const profile: [number, number][] =
    sex === 'n' ? PROFILE.f.map(([r, y], i) => [mix(r, PROFILE.m[i][0]), y]) : PROFILE[sex];
  const k = sex === 'f' ? 0 : sex === 'm' ? 1 : 0.5;
  const sx = mix(0.192, 0.228, k); // плечевой сустав
  const thigh = mix(0.08, 0.074, k);
  const hip = mix(0.09, 0.082, k);

  const arm = mix(0.043, 0.05, k);
  const side = (s: 1 | -1): Capsule[] => [
    // рука
    { a: [s * sx, 1.372, 0], b: [s * (sx + 0.045), 1.12, 0], r: arm, r2: arm * 0.8 },
    { a: [s * (sx + 0.045), 1.12, 0], b: [s * (sx + 0.07), 0.885, 0.02], r: arm * 0.8, r2: arm * 0.6 },
    { a: [s * (sx + 0.072), 0.86, 0.02], b: [s * (sx + 0.076), 0.79, 0.03], r: 0.03, r2: 0.024 },
    // нога
    { a: [s * hip, 0.86, 0], b: [s * 0.08, 0.5, 0], r: thigh, r2: 0.052 },
    { a: [s * 0.08, 0.5, 0], b: [s * 0.074, 0.09, 0], r: 0.052, r2: 0.034 },
    { a: [s * 0.074, 0.04, 0], b: [s * 0.08, 0.032, 0.12], r: 0.036, r2: 0.03 },
  ];

  return {
    torso: {
      pelvis: profile.slice(0, 5),
      abdomen: profile.slice(4, 8),
      chest: profile.slice(7),
    },
    depth: 0.62,
    head: { c: [0, 1.622, 0], r: [0.086, 0.118, 0.098] },
    neck: { a: [0, 1.45, 0], b: [0, 1.52, 0], r: mix(0.043, 0.05, k) },
    limbs: [...side(1), ...side(-1)],
    // печень — справа у человека, то есть слева для зрителя
    liver: { c: [-0.062, 1.135, 0.03], r: [0.074, 0.044, 0.05] },
    thyroid: { c: [0, 1.478, 0.028], r: [0.03, 0.02, 0.02] },
  };
}

/** Высота точки тела → доля высоты кадра от верхнего края (0…1). */
export const yToFrac = (y: number) => 0.5 - (y - BODY_HEIGHT / 2) / VIEW_HEIGHT;

// ---------- цвет зон ----------

export const COLORS = { brand: '#1F6F5C', now: '#E0A23B', goal: '#2FA57A' } as const;

const hexToRgb = (hex: string): Vec3 => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const NOW = hexToRgb(COLORS.now);
const GOAL = hexToRgb(COLORS.goal);

/** 0 — янтарный («сейчас»), 1 — зелёный («цель»). */
export const valueToT = (v: number) => Math.min(1, Math.max(0, (v - 45) / 40));

/** Цвет зоны по значению шкалы: интерполяция янтарный → зелёный. */
export function zoneColor(v: number): string {
  const t = valueToT(v);
  const c = NOW.map((n, i) => Math.round(n + (GOAL[i] - n) * t));
  return `#${c.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/** Высоты зон для привязки подписей. */
export const ZONE_Y: Record<ZoneId, number> = {
  head: 1.63,
  thyroid: 1.475,
  chest: 1.31,
  liver: 1.135,
  abdomen: 1.08,
  pelvis: 0.9,
  skin: 0.62,
};
