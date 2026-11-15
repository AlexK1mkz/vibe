// Вопросы первичного теста (ТЗ, раздел 6.1). Тексты меняются здесь, веса — в src/lib/scoring.ts.
import type { ZoneId } from '../components/body3d/model';

export type Sex = 'f' | 'm';
export type Age = '25-34' | '35-44' | '45-54' | '55+';
export type Goal = 'weight' | 'energy' | 'hormones' | 'skin' | 'sexual' | 'check';
export type EnergyLevel = 'good' | 'dip' | 'tired';
export type SleepQuality = 'good' | 'unrested' | 'insomnia';
export type WeightChange = 'stable' | 'plus3' | 'plus8' | 'yoyo';
export type Symptom = 'headache' | 'hairskin' | 'anxiety' | 'libido' | 'sugar' | 'liver' | 'none';
export type LastTests = 'year' | '1-3' | 'unknown';
export type Format = 'program' | 'course' | 'tests' | 'explore';

export interface Answers {
  sex?: Sex;
  age?: Age;
  /** Рост, см. Вместе с весом даёт ИМТ — он влияет на шкалу «Вес и состав тела». */
  height?: number;
  /** Вес, кг. */
  mass?: number;
  goal?: Goal;
  energy?: EnergyLevel;
  sleep?: SleepQuality;
  weight?: WeightChange;
  symptoms?: Symptom[];
  lastTests?: LastTests;
  format?: Format;
}

export type QuestionId = keyof Answers;

export interface Question {
  id: QuestionId;
  title: string;
  hint?: string;
  multi?: boolean;
  /** «body» — рост и вес ползунками вместо вариантов ответа. */
  kind?: 'body';
  /** Зона модели, которая подсвечивается, пока вопрос на экране. */
  zone?: ZoneId;
  options: { id: string; label: string; exclusive?: boolean }[];
}

export const questions: Question[] = [
  {
    id: 'sex',
    title: 'Кто вы?',
    options: [
      { id: 'f', label: 'Женщина' },
      { id: 'm', label: 'Мужчина' },
    ],
  },
  {
    id: 'age',
    title: 'Ваш возраст',
    options: [
      { id: '25-34', label: '25–34' },
      { id: '35-44', label: '35–44' },
      { id: '45-54', label: '45–54' },
      { id: '55+', label: '55 и больше' },
    ],
  },
  {
    id: 'height',
    kind: 'body',
    title: 'Рост и вес',
    hint: 'Двигайте ползунки — зелёная зона на шкале веса подстраивается под ваш рост',
    zone: 'abdomen',
    options: [],
  },
  {
    id: 'goal',
    title: 'Что важнее всего сейчас?',
    options: [
      { id: 'weight', label: 'Снизить вес' },
      { id: 'energy', label: 'Вернуть энергию' },
      { id: 'hormones', label: 'Гормональный баланс' },
      { id: 'skin', label: 'Кожа и молодость' },
      { id: 'sexual', label: 'Мужское / женское здоровье' },
      { id: 'check', label: 'Просто проверить себя' },
    ],
  },
  {
    id: 'energy',
    title: 'Как у вас с энергией в течение дня?',
    zone: 'chest',
    options: [
      { id: 'good', label: 'Бодрость весь день' },
      { id: 'dip', label: 'Спад после обеда' },
      { id: 'tired', label: 'Устаю уже с утра' },
    ],
  },
  {
    id: 'sleep',
    title: 'Как вы спите?',
    zone: 'head',
    options: [
      { id: 'good', label: 'Высыпаюсь' },
      { id: 'unrested', label: 'Сплю, но не восстанавливаюсь' },
      { id: 'insomnia', label: 'Трудно уснуть или просыпаюсь ночью' },
    ],
  },
  {
    id: 'weight',
    title: 'Что с весом за последний год?',
    zone: 'abdomen',
    options: [
      { id: 'stable', label: 'Стабилен' },
      { id: 'plus3', label: 'Прибавилось 3–7 кг' },
      { id: 'plus8', label: 'Прибавилось 8 кг и больше' },
      { id: 'yoyo', label: 'Худею, но не получается удержать' },
    ],
  },
  {
    id: 'symptoms',
    title: 'Что из этого замечаете?',
    hint: 'Можно выбрать несколько',
    multi: true,
    zone: 'skin',
    options: [
      { id: 'headache', label: 'Головные боли' },
      { id: 'hairskin', label: 'Выпадение волос, сухая кожа' },
      { id: 'anxiety', label: 'Тревожность' },
      { id: 'libido', label: 'Снижение либидо' },
      { id: 'sugar', label: 'Тяга к сладкому' },
      { id: 'liver', label: 'Тяжесть в правом боку' },
      { id: 'none', label: 'Ничего из этого', exclusive: true },
    ],
  },
  {
    id: 'lastTests',
    title: 'Когда последний раз сдавали анализы?',
    options: [
      { id: 'year', label: 'В этом году' },
      { id: '1-3', label: '1–3 года назад' },
      { id: 'unknown', label: 'Не помню' },
    ],
  },
  {
    id: 'format',
    title: 'Какой формат вам ближе?',
    options: [
      { id: 'program', label: 'Программа с личным сопровождением врача' },
      { id: 'course', label: 'Курс под одну задачу' },
      { id: 'tests', label: 'Сначала только анализы' },
      { id: 'explore', label: 'Пока изучаю' },
    ],
  },
];

/** Границы и шаг ползунков роста и веса; стартовые значения — по полу. */
export const bodyLimits = {
  height: { min: 140, max: 210, step: 1 },
  /** Абсолютные границы веса; сама шкала строится от роста (ИМТ 15–50), см. BodyMetrics.tsx. */
  mass: { min: 30, max: 220, step: 1 },
  defaults: { f: { height: 165, mass: 62 }, m: { height: 178, mass: 80 } },
} as const;

/** Подпись выбранного варианта: для заявки и таблицы. */
export function optionLabel(id: QuestionId, value: string | undefined): string {
  if (!value) return '';
  return questions.find((q) => q.id === id)?.options.find((o) => o.id === value)?.label ?? value;
}

/** Формулировка цели для результата и сообщения в WhatsApp. */
export const goalLabels: Record<Goal, string> = {
  weight: 'снизить вес',
  energy: 'вернуть энергию',
  hormones: 'гормональный баланс',
  skin: 'кожа и молодость',
  sexual: 'мужское / женское здоровье',
  check: 'проверить себя',
};
