// Подсчёт результата теста (ТЗ 6.2). Чистые функции без побочных эффектов.
// Чтобы изменить «строгость» теста, правьте START, FLOOR и таблицу WEIGHTS.
import type { Answers, Symptom } from '../content/quiz';
import type { DirectionId } from '../content/directions';
import type { ZoneId, ZoneValues } from '../components/body3d/model';

export type ScaleId = 'energy' | 'sleep' | 'weight' | 'hormones' | 'skin' | 'stress';
export type Scales = Record<ScaleId, number>;
export type Segment = 'A' | 'B' | 'C' | 'D';

export const SCALE_IDS: ScaleId[] = ['energy', 'sleep', 'weight', 'hormones', 'skin', 'stress'];

export const START = 85;
export const FLOOR = 15;
/** Шкалы от этого значения считаются сильными: цель — «поддерживаем». */
export const MAINTAIN_FROM = 80;
export const GOAL_CAP = 90;

type Penalty = Partial<Scales>;

/** Сколько баллов отнимает каждый ответ. */
export const WEIGHTS = {
  age: {
    '25-34': {},
    '35-44': { skin: 3 },
    '45-54': { skin: 5, hormones: 5 },
    '55+': { skin: 8, hormones: 10 },
  },
  energy: {
    good: {},
    dip: { energy: 17, stress: 5 },
    tired: { energy: 35, sleep: 5, hormones: 8 },
  },
  sleep: {
    good: {},
    unrested: { sleep: 25, energy: 10 },
    insomnia: { sleep: 37, stress: 15, energy: 10 },
  },
  weight: {
    stable: {},
    plus3: { weight: 20 },
    plus8: { weight: 40, hormones: 10 },
    yoyo: { weight: 27, stress: 5, hormones: 5 },
  },
  symptoms: {
    headache: { stress: 10, energy: 5 },
    hairskin: { skin: 27, hormones: 10 },
    anxiety: { stress: 27, sleep: 5 },
    libido: { hormones: 25, energy: 5 },
    sugar: { weight: 10, hormones: 8 },
    liver: { weight: 5, skin: 5 },
    none: {},
  },
} satisfies Record<string, Record<string, Penalty>>;

// ---------- рост и вес ----------

/** Индекс массы тела, округлённый до десятых. null — рост или вес не указаны. */
export function bmi(height?: number, mass?: number): number | null {
  if (!height || !mass) return null;
  return Math.round((mass / (height / 100) ** 2) * 10) / 10;
}

export type BmiBand = 'low' | 'norm' | 'over' | 'high' | 'veryHigh';

/** Границы ИМТ по ВОЗ: 18,5 / 25 / 30 / 35. */
export const BMI_EDGES = [18.5, 25, 30, 35] as const;

export function bmiBand(value: number): BmiBand {
  if (value < 18.5) return 'low';
  if (value < 25) return 'norm';
  if (value < 30) return 'over';
  if (value < 35) return 'high';
  return 'veryHigh';
}

/** Вес (кг) при заданном ИМТ и росте — для «нормы для вашего роста» на шкале веса. */
export const massAt = (bmiValue: number, height: number) => bmiValue * (height / 100) ** 2;

/** Сколько баллов отнимает ИМТ. Формулировки для посетителя — в BodyMetrics.tsx. */
export const BMI_WEIGHTS: Record<BmiBand, Penalty> = {
  low: { weight: 10, hormones: 5, energy: 5 },
  norm: {},
  over: { weight: 12 },
  high: { weight: 24, hormones: 5 },
  veryHigh: { weight: 34, hormones: 8 },
};

export interface QuizResult {
  scales: Scales;
  goals: Scales;
  index: number;
  goalIndex: number;
  direction: DirectionId;
  /** Фокус чекапа совпадает с направлением: по нему берётся название из content/checkups.ts. */
  checkup: DirectionId;
  segment: Segment;
  flags: { ferritin: boolean; liver: boolean };
  /** Шкалы, которым нужно внимание: от слабой к сильной, 2–4 штуки. */
  attention: ScaleId[];
}

const clamp = (v: number) => Math.max(FLOOR, Math.min(100, Math.round(v)));
const mean = (s: Scales) => Math.round(SCALE_IDS.reduce((sum, id) => sum + s[id], 0) / SCALE_IDS.length);
const has = (a: Answers, s: Symptom) => !!a.symptoms?.includes(s);

/** Шкалы по ответам. Работает и с неполными ответами — так модель «оживает» по ходу теста. */
export function computeScales(a: Answers): Scales {
  const s = Object.fromEntries(SCALE_IDS.map((id) => [id, START])) as Scales;
  const apply = (p: Penalty | undefined) => {
    if (!p) return;
    for (const id of SCALE_IDS) s[id] -= p[id] ?? 0;
  };
  if (a.age) apply(WEIGHTS.age[a.age]);
  const b = bmi(a.height, a.mass);
  if (b !== null) apply(BMI_WEIGHTS[bmiBand(b)]);
  if (a.energy) apply(WEIGHTS.energy[a.energy]);
  if (a.sleep) apply(WEIGHTS.sleep[a.sleep]);
  if (a.weight) apply(WEIGHTS.weight[a.weight]);
  for (const sym of a.symptoms ?? []) apply(WEIGHTS.symptoms[sym]);
  for (const id of SCALE_IDS) s[id] = clamp(s[id]);
  return s;
}

/** Цель программы по шкале: целевой диапазон, а не обещание. */
export function goalFor(current: number): number {
  if (current >= MAINTAIN_FROM) return current;
  return Math.round(Math.min(GOAL_CAP, current + (GOAL_CAP - current) * 0.8));
}

export const isMaintained = (current: number) => current >= MAINTAIN_FROM;

const lowestScale = (s: Scales): ScaleId =>
  SCALE_IDS.reduce((low, id) => (s[id] < s[low] ? id : low), SCALE_IDS[0]);

function pickDirection(a: Answers, s: Scales, flags: QuizResult['flags']): DirectionId {
  const female = a.sex !== 'm';
  switch (a.goal) {
    case 'weight': return 'weight';
    case 'energy': return flags.ferritin ? 'ferritin' : 'energy';
    case 'hormones': return 'hormones';
    case 'skin': return female ? 'ferritin' : 'hormones';
    case 'sexual': return female ? 'ferritin' : 'mens';
    default: {
      // «Просто проверить себя»: идём от признаков и самой слабой шкалы
      if (flags.liver) return 'liver';
      if (flags.ferritin) return 'ferritin';
      const low = lowestScale(s);
      if (s[low] >= MAINTAIN_FROM) return 'energy';
      if (low === 'weight') return 'weight';
      if (low === 'hormones') return 'hormones';
      if (low === 'skin') return female ? 'ferritin' : 'hormones';
      return 'energy';
    }
  }
}

/** Сегмент считается из вопросов 3, 8 и 9 и посетителю не показывается. */
function pickSegment(a: Answers): Segment {
  switch (a.format) {
    case 'program': return 'A';
    case 'course': return 'B';
    case 'tests': return 'C';
    default:
      // «Пока изучаю», но есть конкретная задача и анализы давно не сдавались — ведём к чекапу
      return a.goal && a.goal !== 'check' && a.lastTests === 'unknown' ? 'C' : 'D';
  }
}

export function score(a: Answers): QuizResult {
  const scales = computeScales(a);
  const goals = Object.fromEntries(SCALE_IDS.map((id) => [id, goalFor(scales[id])])) as Scales;
  const flags = {
    ferritin: a.sex === 'f' && (has(a, 'headache') || has(a, 'hairskin')) && !!a.energy && a.energy !== 'good',
    liver: has(a, 'liver'),
  };
  const direction = pickDirection(a, scales, flags);
  const sorted = [...SCALE_IDS].sort((x, y) => scales[x] - scales[y]);
  const weak = sorted.filter((id) => !isMaintained(scales[id]));
  const attention = (weak.length >= 2 ? weak : sorted.slice(0, 2)).slice(0, 4);
  return {
    scales,
    goals,
    index: mean(scales),
    goalIndex: mean(goals),
    direction,
    checkup: direction,
    segment: pickSegment(a),
    flags,
    attention,
  };
}

// ---------- связь шкал и зон модели ----------

export const SCALE_ZONE: Record<ScaleId, ZoneId> = {
  energy: 'chest',
  sleep: 'head',
  stress: 'head',
  weight: 'abdomen',
  hormones: 'thyroid',
  skin: 'skin',
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Значения зон для модели. t = 0 — «сейчас», t = 1 — «цель программы».
 * Подсвечиваются только зоны, где шкала ниже MAINTAIN_FROM.
 */
export function zoneValues(scales: Scales, opts: { t?: number; liver?: boolean } = {}): ZoneValues {
  const t = opts.t ?? 0;
  const at = (id: ScaleId) => lerp(scales[id], goalFor(scales[id]), t);
  const weak = (id: ScaleId) => !isMaintained(scales[id]);
  const z: ZoneValues = {};
  if (weak('sleep') || weak('stress')) z.head = Math.min(at('sleep'), at('stress'));
  if (weak('hormones')) {
    z.thyroid = at('hormones');
    z.pelvis = at('hormones');
  }
  if (weak('energy')) z.chest = at('energy');
  if (weak('weight')) z.abdomen = at('weight');
  if (weak('skin')) z.skin = at('skin');
  if (opts.liver) z.liver = lerp(50, goalFor(50), t);
  return z;
}

export function interpretation(index: number): string {
  if (index >= 80) return 'Ресурс в хорошем состоянии. Задача — удержать его и проверить по анализам.';
  if (index >= 60) return 'Ресурс есть, но в нескольких зонах вы его теряете. Анализы покажут, где именно.';
  return 'Организм работает в режиме экономии. Стоит разобраться в причинах, начав с анализов.';
}
