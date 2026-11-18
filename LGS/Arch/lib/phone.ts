/** Телефон Казахстана: +7 и 10 цифр. Возвращает +7XXXXXXXXXX или null. */
export function normalizePhone(input: string): string | null {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  if (!/^[67]\d{9}$/.test(digits)) return null;
  return `+7${digits}`;
}

/**
 * Десять цифр номера без кода страны.
 * Код «+7» вырезается, где бы он ни стоял: курсор может оказаться и перед ним.
 * Номер, вставленный без «+7», остаётся как есть; 11 цифр с 7 или 8 в начале теряют первую.
 */
function nationalDigits(input: string): string {
  const raw = input || "";
  const plus = raw.indexOf("+7");
  let digits: string;
  if (plus >= 0) {
    digits = (raw.slice(0, plus) + raw.slice(plus + 2)).replace(/\D/g, "");
  } else {
    digits = raw.replace(/\D/g, "");
  }
  if (digits.length > 10 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Маска ввода: +7 (7__) ___-__-__ */
export function maskPhone(input: string): string {
  const digits = nationalDigits(input);
  let out = "+7";
  if (digits.length > 0) out += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += ")";
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}
