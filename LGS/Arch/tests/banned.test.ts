import { describe, expect, it } from "vitest";
// @ts-expect-error: скрипт на чистом JS без типов
import { RULES, scan } from "../scripts/check-banned.mjs";

describe("запреты раздела 3 ТЗ", () => {
  it("в текстах обоих сайтов нет запрещённых слов", () => {
    const findings = scan() as { file: string; line: number; word: string; rule: string }[];
    expect(findings.map((f) => `${f.file}:${f.line} «${f.word}» (${f.rule})`)).toEqual([]);
  });

  it("шаблоны ловят запрещённые формулировки", () => {
    const hit = (text: string) => (RULES as { re: RegExp }[]).some(({ re }) => new RegExp(re.source, re.flags).test(text));
    for (const bad of [
      "избавим от фобий",
      "исцеление за три дня",
      "скрытое управление людьми",
      "гарантируем рост дохода",
      "официальное представительство",
      "психологическая диагностика",
      "ваш архетип",
      "войти в транс",
      "курс терапии",
    ]) {
      expect(hit(bad), bad).toBe(true);
    }
    for (const ok of ["транспорт", "трансляция эфира", "договариваться и защищаться от давления"]) {
      expect(hit(ok), ok).toBe(false);
    }
  });
});
