import { describe, expect, it } from 'vitest';
import { formatPhone, isPhoneComplete, nextPhone, phoneDigits } from './phone';

describe('formatPhone', () => {
  const full = '+7 (700) 111-22-33';
  it('номер без кода страны: первая семёрка — часть кода оператора', () => {
    expect(formatPhone('7001112233')).toBe(full);
    expect(formatPhone('7')).toBe('+7 (7');
  });
  it('номер с кодом страны, с восьмёркой и уже отформатированный', () => {
    expect(formatPhone('+77001112233')).toBe(full);
    expect(formatPhone('77001112233')).toBe(full);
    expect(formatPhone('87001112233')).toBe(full);
    expect(formatPhone('8 700 111 22 33')).toBe(full);
    expect(formatPhone(full)).toBe(full);
  });
  it('посимвольный ввод даёт тот же результат', () => {
    let value = '';
    for (const ch of '7001112233') value = nextPhone(value, value + ch);
    expect(value).toBe(full);
    expect(isPhoneComplete(value)).toBe(true);
    expect(phoneDigits(value)).toBe('77001112233');
  });
  it('лишние цифры отбрасываются, пустой ввод остаётся пустым', () => {
    expect(formatPhone(full + '9')).toBe(full);
    expect(formatPhone('')).toBe('');
    expect(formatPhone('+')).toBe('');
  });
});

describe('nextPhone', () => {
  it('стирание символа маски стирает и цифру', () => {
    expect(nextPhone('+7 (700) ', '+7 (700)')).toBe('+7 (70');
    expect(nextPhone('+7 (700) 111-', '+7 (700) 111')).toBe('+7 (700) 11');
  });
  it('неполный номер не проходит проверку', () => {
    expect(isPhoneComplete('+7 (700) 111-22-3')).toBe(false);
  });
});
