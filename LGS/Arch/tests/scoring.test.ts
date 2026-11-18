import { describe, expect, it } from "vitest";
import { test as content, type ArchetypeCode } from "@/lib/content";
import { AnswersError, buildResult, computeResult, rankArchetypes, type Scores } from "@/lib/scoring";

const OPTS = { maxScore: 8, pairMaxDiff: 1 };
const ORDER = content.tieOrder;
const zero = (): Scores => ({ S: 0, D: 0, N: 0, V: 0, O: 0, B: 0 });

function fullAnswers(pickB: (qid: string) => ArchetypeCode | undefined = () => undefined) {
  const answers: Record<string, string> = {};
  for (const q of content.questions) {
    const wanted = q.block === "B" ? pickB(q.id) : undefined;
    const option = q.options.find((o) => o.archetype === wanted) ?? q.options[0];
    answers[q.id] = option.id;
  }
  return answers;
}

describe("подсчёт архетипа", () => {
  it("считает баллы и профиль в процентах", () => {
    const { result } = computeResult(content, fullAnswers(() => "D"), OPTS);
    expect(result.scores.D).toBe(8);
    expect(result.profile.D).toBe(100);
    expect(result.primary).toBe("D");
    expect(Object.values(result.scores).reduce((a, b) => a + b, 0)).toBe(12);
  });

  it("возвращает выборы блоков A, C, D", () => {
    const { selections } = computeResult(content, fullAnswers(), OPTS);
    expect(selections).toEqual({
      job: "money",
      cost: "money",
      goal: "price",
      occupation: "entrepreneur",
      incomeBand: "lt250",
    });
  });

  it("отклоняет неполные и чужие ответы", () => {
    const answers = fullAnswers();
    delete answers.B5;
    expect(() => computeResult(content, answers, OPTS)).toThrow(AnswersError);
    expect(() => computeResult(content, { ...fullAnswers(), B1: "B2_S" }, OPTS)).toThrow(AnswersError);
  });

  it("равенство баллов: побеждает тот, кто чаще выбран в вопросах давления", () => {
    const scores = { ...zero(), S: 4, N: 4, D: 2, V: 2 };
    const pressure = { ...zero(), N: 2, S: 1 };
    expect(rankArchetypes(scores, pressure, ORDER).slice(0, 2)).toEqual(["N", "S"]);
  });

  it("равенство и в вопросах давления: порядок S, D, N, V, O, B", () => {
    const scores = { S: 2, D: 2, N: 2, V: 2, O: 2, B: 2 };
    expect(rankArchetypes(scores, zero(), ORDER)).toEqual(["S", "D", "N", "V", "O", "B"]);
    const two = { ...zero(), O: 6, B: 6 };
    expect(rankArchetypes(two, zero(), ORDER).slice(0, 2)).toEqual(["O", "B"]);
  });

  it("равенство за второе место решается теми же правилами", () => {
    const scores = { ...zero(), D: 6, V: 3, B: 3 };
    const pressure = { ...zero(), B: 1 };
    expect(rankArchetypes(scores, pressure, ORDER).slice(0, 2)).toEqual(["D", "B"]);
  });

  it("связка: разница 1 балл или меньше", () => {
    expect(buildResult({ ...zero(), S: 5, D: 4, N: 3 }, zero(), ORDER, OPTS).isPair).toBe(true);
    expect(buildResult({ ...zero(), S: 6, D: 4, N: 2 }, zero(), ORDER, OPTS).isPair).toBe(false);
    expect(buildResult({ ...zero(), S: 6, D: 6 }, zero(), ORDER, OPTS).isPair).toBe(true);
  });

  it("все 16 777 216 комбинаций ответов блока B дают корректный архетип", () => {
    const bQuestions = content.questions.filter((q) => q.block === "B");
    const idx: Record<string, number> = { S: 0, D: 1, N: 2, V: 3, O: 4, B: 5 };
    const opts = bQuestions.map((q) => q.options.map((o) => idx[o.archetype!]));
    const isPressure = bQuestions.map((q) => content.pressureQuestions.includes(q.id));
    const total = 4 ** bQuestions.length;
    const s = new Int8Array(6);
    const p = new Int8Array(6);
    let bad = 0;
    for (let n = 0; n < total; n++) {
      s.fill(0);
      p.fill(0);
      let rest = n;
      for (let q = 0; q < opts.length; q++) {
        const a = opts[q][rest & 3];
        rest >>= 2;
        s[a]++;
        if (isPressure[q]) p[a]++;
      }
      // Независимая проверка: лучший по (баллы, давление, порядок S, D, N, V, O, B)
      let best = 0;
      for (let i = 1; i < 6; i++) {
        if (s[i] > s[best] || (s[i] === s[best] && p[i] > p[best])) best = i;
      }
      let second = -1;
      for (let i = 0; i < 6; i++) {
        if (i === best) continue;
        if (second < 0 || s[i] > s[second] || (s[i] === s[second] && p[i] > p[second])) second = i;
      }
      const scores = { S: s[0], D: s[1], N: s[2], V: s[3], O: s[4], B: s[5] };
      const pressure = { S: p[0], D: p[1], N: p[2], V: p[3], O: p[4], B: p[5] };
      const ranking = rankArchetypes(scores, pressure, ORDER);
      if (ranking[0] !== ORDER[best] || ranking[1] !== ORDER[second] || ranking.length !== 6) bad++;
    }
    expect(total).toBe(16_777_216);
    expect(bad).toBe(0);
  });
});
