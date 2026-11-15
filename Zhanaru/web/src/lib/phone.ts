// Маска телефона +7 (___) ___-__-__ для казахстанских номеров.

/** Десять цифр номера без кода страны. Коды операторов в Казахстане сами начинаются с 7 (700, 701, 777…). */
function nationalDigits(input: string): string {
  const raw = input.trim();
  let d = raw.replace(/\D/g, '');
  if (raw.startsWith('+7')) d = d.slice(1); // уже отформатировано или введено с кодом страны
  else if (d.startsWith('8')) d = d.slice(1); // «8» — выход на межгород
  else if (d.length === 11 && d.startsWith('7')) d = d.slice(1); // вставлен номер целиком: 7 700 …
  return d.slice(0, 10);
}

export function formatPhone(input: string): string {
  const d = nationalDigits(input);
  if (!d) return '';
  let out = '+7 (' + d.slice(0, 3);
  if (d.length >= 3) out += ') ' + d.slice(3, 6);
  if (d.length >= 6) out += '-' + d.slice(6, 8);
  if (d.length >= 8) out += '-' + d.slice(8, 10);
  return out;
}

/** Новое значение поля после ввода. Если стёрли символ маски (скобку, дефис) — стираем и цифру перед ним. */
export function nextPhone(prev: string, input: string): string {
  const next = formatPhone(input);
  if (input.length < prev.length && next === prev) return formatPhone('+7' + nationalDigits(prev).slice(0, -1));
  return next;
}

/** Все цифры номера вместе с кодом страны: 11 цифр у полного номера. */
export const phoneDigits = (masked: string) => masked.replace(/\D/g, '');
export const isPhoneComplete = (masked: string) => /^7\d{10}$/.test(phoneDigits(masked));
