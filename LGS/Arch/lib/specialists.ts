/**
 * Лендинг и анкета специалистов (ТЗ v2, раздел 8). Все тексты лежат в content/specialists.json
 * (читается через lib/specialists-content.ts), здесь только типы, правила полей анкеты
 * и общая для клиента и сервера проверка. Файл попадает в клиентский бандл: JSON сюда не импортируем.
 */

export const SPECIALIST_ROLES = ["practitioner", "master", "trainer"] as const;
export type SpecialistRole = (typeof SPECIALIST_ROLES)[number];

export const isSpecialistRole = (value: unknown): value is SpecialistRole =>
  typeof value === "string" && (SPECIALIST_ROLES as readonly string[]).includes(value);

/** Предельная длина полей анкеты. Одни и те же числа в форме и в API. */
export const SPECIALIST_LIMITS = {
  name: 80,
  city: 120,
  education: 400,
  certificate: 200,
  practiceHours: 60,
  weeklyHours: 60,
  profileUrl: 300,
  motivation: 300,
} as const;

/**
 * Ссылка на профиль: необязательное поле.
 * Пустая строка → null. Адрес без протокола дополняется https://. Принимается и ник вида @name.
 * Возвращает false, если значение не похоже ни на адрес, ни на ник.
 */
export function normalizeProfileUrl(input: unknown): string | null | false {
  if (typeof input !== "string") return input == null ? null : false;
  const value = input.trim();
  if (!value) return null;
  if (value.length > SPECIALIST_LIMITS.profileUrl || /\s/.test(value)) return false;
  if (/^@[\w.]{2,}$/.test(value)) return value;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (!/^[^.\s]+(\.[^.\s]+)+$/.test(url.hostname)) return false;
    return url.toString();
  } catch {
    return false;
  }
}

interface PathStep {
  name: string;
  does: string;
  gets: string;
  next: string;
  todo?: string;
}

interface Leader {
  name: string;
  role: string;
  photo: string | null;
  photoAlt: string;
  facts: string[];
  todo?: string;
}

interface Story {
  name: string;
  role: string;
  text: string;
  photo?: string | null;
}

export interface SpecialistFormStrings {
  eyebrow: string;
  title: string;
  lead: string;
  formTitle: string;
  name: string;
  namePlaceholder: string;
  whatsapp: string;
  city: string;
  cityPlaceholder: string;
  role: string;
  roles: Record<SpecialistRole, string>;
  trainerHint: string;
  education: string;
  educationPlaceholder: string;
  certificate: string;
  certificatePlaceholder: string;
  practiceHours: string;
  practiceHoursPlaceholder: string;
  weeklyHours: string;
  weeklyHoursPlaceholder: string;
  profileUrl: string;
  profileUrlPlaceholder: string;
  optional: string;
  motivation: string;
  motivationPlaceholder: string;
  motivationCounter: string;
  submit: string;
  errors: { role: string; profileUrl: string; motivation: string; validation: string };
}

export interface SpecialistsContent {
  meta: { title: string; description: string };
  common: { cta: string };
  hero: { eyebrow: string; title: string; subtitle: string; trainerNote: string };
  problem: { eyebrow: string; title: string; items: { title: string; text: string }[] };
  path: {
    eyebrow: string;
    title: string;
    labels: { does: string; gets: string; next: string };
    pending: string;
    steps: PathStep[];
  };
  roles: {
    eyebrow: string;
    title: string;
    labels: { does: string; load: string };
    items: { id: string; name: string; does: string; load: string; badge: string }[];
  };
  benefits: { eyebrow: string; title: string; items: string[] };
  conditions: {
    eyebrow: string;
    title: string;
    lead: string;
    columns: { what: string; terms: string };
    rows: { what: string; terms: string; published: boolean; todo?: string }[];
  };
  flow: { eyebrow: string; title: string; stats: { value: string; label: string }[] };
  selection: { eyebrow: string; title: string; steps: { title: string; text: string }[] };
  leaders: { eyebrow: string; title: string; items: Leader[] };
  stories: { enabled: boolean; eyebrow: string; title: string; items: Story[] };
  form: SpecialistFormStrings;
  faq: { eyebrow: string; title: string; items: { q: string; a: string; todo?: string }[] };
  thanks: { title: string; text: string; nextTitle: string; steps: string[]; back: string };
}
