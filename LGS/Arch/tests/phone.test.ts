import { describe, expect, it } from "vitest";
import { maskPhone, normalizePhone } from "@/lib/phone";

describe("телефон", () => {
  it("маска при вводе по одной цифре", () => {
    let value = "+7";
    for (const ch of "7001234567") value = maskPhone(value + ch);
    expect(value).toBe("+7 (700) 123-45-67");
  });

  it("цифра, введённая перед «+7», не теряется и не удваивается", () => {
    let value = maskPhone("7" + "+7");
    expect(value).toBe("+7 (7");
    for (const ch of "001234567") value = maskPhone(value + ch);
    expect(value).toBe("+7 (700) 123-45-67");
  });

  it("вставка номера в разных форматах", () => {
    expect(maskPhone("7051234567")).toBe("+7 (705) 123-45-67");
    expect(maskPhone("87051234567")).toBe("+7 (705) 123-45-67");
    expect(maskPhone("+7 705 123 45 67")).toBe("+7 (705) 123-45-67");
    expect(maskPhone("77051234567")).toBe("+7 (705) 123-45-67");
  });

  it("стирание до пустого поля оставляет «+7»", () => {
    expect(maskPhone("+")).toBe("+7");
    expect(maskPhone("")).toBe("+7");
    expect(maskPhone("+7 (70")).toBe("+7 (70");
  });

  it("нормализация и проверка формата", () => {
    expect(normalizePhone("+7 (700) 123-45-67")).toBe("+77001234567");
    expect(normalizePhone("8 705 123 45 67")).toBe("+77051234567");
    expect(normalizePhone("+7 (700) 123-45")).toBeNull();
    expect(normalizePhone("+7 (123) 456-78-90")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
});
