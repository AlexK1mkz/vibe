import { formatPrice, funnel } from "@/config/funnel";
import { ru, type Dictionary } from "./ru";

export type Locale = "ru";
export const defaultLocale: Locale = "ru";

const dictionaries: Record<Locale, Dictionary> = { ru };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale];
}

/** Значения из конфига воронки для подстановок в текстах */
export const vars: Record<string, string> = {
  consult: formatPrice(funnel.products.consult.price),
  intensive: formatPrice(funnel.products.intensive.price),
  vip: formatPrice(funnel.products.vip.price),
  duration: String(funnel.products.consult.durationMin),
  dates: funnel.intensive.datesLabel,
  intensiveName: funnel.intensive.name,
  practitioner: funnel.practitioner.name,
  months: String(funnel.practitioner.months),
  start: funnel.practitioner.startLabel,
  email: funnel.contacts.email,
  phone: funnel.contacts.phone,
};

/** Подставляет {ключ} из конфига и из extra */
export function fmt(text: string, extra: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = extra[key] ?? vars[key];
    return value === undefined ? match : String(value);
  });
}

export type { Dictionary };
