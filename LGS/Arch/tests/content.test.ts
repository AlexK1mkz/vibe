import { describe, expect, it } from "vitest";
import { results, test as content } from "@/lib/content";
import messages from "@/content/funnel/messages.json";

const CODES = ["S", "D", "N", "V", "O", "B"] as const;
const JOBS = ["money", "team", "family", "state", "profession"] as const;
const GOALS = ["price", "heard", "decide", "speak", "profession"] as const;
const COSTS = ["money", "time", "relations", "energy"] as const;

describe("контент теста", () => {
  const b = content.questions.filter((q) => q.block === "B");

  it("17 вопросов: 1 + 12 + 2 + 2, блок D в конце", () => {
    expect(content.questions.map((q) => q.block).join("")).toBe("A" + "B".repeat(12) + "CC" + "DD");
  });

  it("в каждом вопросе блока B четыре разных архетипа", () => {
    for (const q of b) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.archetype)).size).toBe(4);
    }
  });

  it("каждый архетип встречается ровно 8 раз", () => {
    for (const code of CODES) {
      expect(b.flatMap((q) => q.options).filter((o) => o.archetype === code)).toHaveLength(8);
    }
  });

  it("идентификаторы вариантов уникальны, вопросы давления существуют", () => {
    const ids = content.questions.flatMap((q) => q.options.map((o) => o.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of content.pressureQuestions) expect(b.some((q) => q.id === id)).toBe(true);
  });

  it("у вопросов A, C, D есть поле и значения", () => {
    for (const q of content.questions.filter((x) => x.block !== "B")) {
      expect(q.sets).toBeTruthy();
      for (const o of q.options) expect(o.value).toBeTruthy();
    }
  });
});

describe("контент интерпретаций", () => {
  it("у каждого архетипа все блоки: 5 слепых зон, 5 целей, техника из 3 шагов", () => {
    for (const code of CODES) {
      const a = results.archetypes[code];
      expect(a.name).toBeTruthy();
      expect(a.core.works).toHaveLength(3);
      expect(a.technique.steps).toHaveLength(3);
      for (const job of JOBS) expect(a.blindZone[job].text.length).toBeGreaterThan(20);
      for (const goal of GOALS) expect(a.possible[goal].items).toHaveLength(3);
    }
    for (const cost of COSTS) expect(results.cost[cost].text.length).toBeGreaterThan(20);
    expect(results.disclaimer.text).toBeTruthy();
  });

  it("значения вопросов совпадают с ключами интерпретаций", () => {
    const values = (id: string) => content.questions.find((q) => q.id === id)!.options.map((o) => o.value);
    expect(values("A1")).toEqual([...JOBS]);
    expect(values("C1")).toEqual([...COSTS]);
    expect(values("C2")).toEqual([...GOALS]);
  });
});

describe("цепочка сообщений", () => {
  it("в каждом сообщении есть способ отписаться", () => {
    for (const m of messages.messages) expect(m.text).toContain("{unsubscribeUrl}");
  });

  it("идентификаторы сообщений уникальны", () => {
    const ids = messages.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
