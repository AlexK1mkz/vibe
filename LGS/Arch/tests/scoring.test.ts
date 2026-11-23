import { describe, expect, it } from "vitest";
import { funnel } from "@/config/funnel";
import { test as content, type BeliefCode, type CeilingCode, type OptionCode, type Sphere } from "@/lib/content";
import {
  AnswersError,
  buildResult,
  computeResult,
  pickBelief,
  pickSphere,
  type BeliefScores,
  type SphereScores,
} from "@/lib/scoring";

const OPTS = { maxScore: 12, freeThreshold: 10 };
const ORDER = content.tieOrder;
const SPHERES = content.spheres;
const B = content.questions.filter((q) => q.block === "B");

/** Ответы на весь тест: pick задаёт код варианта в блоке B, extra переопределяет остальные вопросы */
function fullAnswers(pick: (qid: string) => OptionCode = () => "R", extra: Record<string, string> = {}) {
  const answers: Record<string, string> = {};
  for (const q of content.questions) {
    const option = q.block === "B" ? q.options.find((o) => o.code === pick(q.id))! : q.options[0];
    answers[q.id] = option.id;
  }
  return { ...answers, ...extra };
}

/** Раскладка ответов блока B: {M1: "H", R2: "W", ...}, остальные R */
const pattern = (map: Record<string, OptionCode>) => (qid: string) => map[qid] ?? "R";
const run = (pick: (qid: string) => OptionCode, sphere: Sphere = "money") =>
  computeResult(content, fullAnswers(pick, { A1: `A1_${sphere}` }), OPTS).result;

describe("подсчёт результата", () => {
  it("конфиг совпадает с контентом: 12 вопросов блока B, порог «Свободного хода» 10", () => {
    expect(funnel.test.maxScore).toBe(B.length);
    expect(funnel.test.freeThreshold).toBe(10);
  });

  it("считает баллы типов, ресурсные ответы и ответы по сферам", () => {
    const result = run(pattern({ M1: "H", M2: "H", M3: "B", R1: "W", G1: "H", G2: "B" }), "growth");
    expect(result.scores).toEqual({ H: 3, B: 2, W: 1, R: 6 });
    expect(result.sphereScores).toEqual({ money: 3, relations: 1, growth: 2 });
    expect(result.mainBelief).toBe("H");
    expect(result.mainSphere).toBe("money");
    expect(result.ceiling).toBe("H");
    expect(Object.values(result.scores).reduce((a, b) => a + b, 0)).toBe(12);
  });

  it("профиль для диаграммы: типы от 12, сферы от 4", () => {
    const all = run(() => "W");
    expect(all.profile.beliefs).toEqual({ H: 0, B: 0, W: 100 });
    expect(all.profile.spheres).toEqual({ money: 100, relations: 100, growth: 100 });
    const part = run(pattern({ M1: "H", M2: "H", M3: "B", R1: "W" }));
    expect(part.profile.beliefs).toEqual({ H: 17, B: 8, W: 8 });
    expect(part.profile.spheres).toEqual({ money: 75, relations: 25, growth: 0 });
  });

  it("возвращает выборы блоков A, C, D", () => {
    const { selections } = computeResult(content, fullAnswers(), OPTS);
    expect(selections).toEqual({
      sphere: "money",
      cost: "money",
      goal: "price",
      occupation: "entrepreneur",
      incomeBand: "lt250",
    });
  });

  it("отклоняет неполные и чужие ответы", () => {
    const answers = fullAnswers();
    delete answers.G2;
    expect(() => computeResult(content, answers, OPTS)).toThrow(AnswersError);
    expect(() => computeResult(content, fullAnswers(undefined, { M1: "M2_H" }), OPTS)).toThrow(AnswersError);
    expect(() => computeResult(content, fullAnswers(undefined, { A1: "A1_team" }), OPTS)).toThrow(AnswersError);
    expect(() => computeResult(content, {}, OPTS)).toThrow(AnswersError);
  });
});

describe("главное убеждение: случаи равенства", () => {
  it("без равенства побеждает максимум баллов, сфера из A1 не влияет", () => {
    const pick = pattern({ M1: "H", M2: "H", R1: "H", G1: "W", G2: "W" });
    for (const sphere of SPHERES) expect(run(pick, sphere).mainBelief).toBe("H");
  });

  it("равенство двух типов: побеждает тот, что чаще выбран в сфере из A1", () => {
    // H: 2 в деньгах, 1 в росте. W: 1 в деньгах, 2 в росте. По 3 балла
    const pick = pattern({ M1: "H", M2: "H", M3: "W", G1: "W", G2: "W", G3: "H" });
    expect(run(pick, "money").mainBelief).toBe("H");
    expect(run(pick, "growth").mainBelief).toBe("W");
  });

  it("равенство двух типов и в сфере из A1: порядок B, W, H", () => {
    const hw = pattern({ M1: "H", M2: "W", G1: "H", G2: "W" });
    expect(run(hw, "money").mainBelief).toBe("W");
    expect(run(hw, "relations").mainBelief).toBe("W"); // в отношениях оба типа не выбраны
    const bw = pattern({ M1: "B", M2: "W", R1: "B", R2: "W" });
    expect(run(bw, "money").mainBelief).toBe("B");
    const bh = pattern({ M1: "B", M2: "H", R1: "B", R2: "H" });
    expect(run(bh, "growth").mainBelief).toBe("B");
  });

  it("равенство трёх типов: решает сфера из A1", () => {
    // По 4 балла. Деньги: H, H, H, B. Отношения: W, W, W, B. Рост: B, B, H, W
    const pick = pattern({
      M1: "H", M2: "H", M3: "H", M4: "B",
      R1: "W", R2: "W", R3: "W", R4: "B",
      G1: "B", G2: "B", G3: "H", G4: "W",
    });
    expect(run(pick).scores).toEqual({ H: 4, B: 4, W: 4, R: 0 });
    expect(run(pick, "money").mainBelief).toBe("H");
    expect(run(pick, "relations").mainBelief).toBe("W");
    expect(run(pick, "growth").mainBelief).toBe("B");
  });

  it("равенство трёх типов и в сфере из A1: порядок B, W, H", () => {
    // В каждой сфере по одному H, B и W
    const pick = pattern({ M1: "H", M2: "B", M3: "W", R1: "H", R2: "B", R3: "W", G1: "H", G2: "B", G3: "W" });
    for (const sphere of SPHERES) expect(run(pick, sphere).mainBelief).toBe("B");
    // Среди трёх равных в сфере из A1 лидируют двое: между ними решает порядок
    const two = pattern({ M1: "H", M2: "H", M3: "W", M4: "W", R1: "B", R2: "B", G1: "B", G2: "B", G3: "H", G4: "H", R3: "W", R4: "W" });
    expect(run(two).scores).toEqual({ H: 4, B: 4, W: 4, R: 0 });
    expect(run(two, "money").mainBelief).toBe("W");
  });

  it("сфера из A1 разрешает только равенство и не перевешивает баллы", () => {
    const scores: BeliefScores = { H: 5, B: 4, W: 0 };
    expect(pickBelief(scores, { H: 0, B: 4, W: 0 }, ORDER)).toBe("H");
  });

  it("все ответы ресурсные: главное убеждение по порядку, сфера из A1", () => {
    for (const sphere of SPHERES) {
      const result = run(() => "R", sphere);
      expect(result.scores).toEqual({ H: 0, B: 0, W: 0, R: 12 });
      expect(result.mainBelief).toBe("B");
      expect(result.mainSphere).toBe(sphere);
      expect(result.ceiling).toBe("F");
    }
  });
});

describe("главная сфера: случаи равенства", () => {
  it("без равенства побеждает максимум ограничивающих ответов", () => {
    const pick = pattern({ R1: "H", R2: "B", R3: "W", M1: "H", G1: "H" });
    for (const sphere of SPHERES) expect(run(pick, sphere).mainSphere).toBe("relations");
  });

  it("равенство двух сфер: берётся сфера из A1, если она среди лидеров", () => {
    const pick = pattern({ M1: "H", M2: "H", G1: "W", G2: "W", R1: "B" });
    expect(run(pick, "money").mainSphere).toBe("money");
    expect(run(pick, "growth").mainSphere).toBe("growth");
  });

  it("равенство двух сфер, сфера из A1 не среди лидеров: первая из лидеров по порядку", () => {
    const pick = pattern({ M1: "H", M2: "H", G1: "W", G2: "W", R1: "B" });
    expect(run(pick, "relations").mainSphere).toBe("money");
    const rg = pattern({ R1: "H", R2: "H", G1: "W", G2: "W", M1: "B" });
    expect(run(rg, "money").mainSphere).toBe("relations");
  });

  it("равенство трёх сфер: сфера из A1", () => {
    const pick = pattern({ M1: "H", R1: "B", G1: "W" });
    for (const sphere of SPHERES) expect(run(pick, sphere).mainSphere).toBe(sphere);
    for (const sphere of SPHERES) expect(run(() => "H", sphere).mainSphere).toBe(sphere);
  });

  it("pickSphere не зависит от порядка ключей в объекте", () => {
    const scores: SphereScores = { growth: 3, relations: 3, money: 1 };
    expect(pickSphere(scores, "money", SPHERES)).toBe("relations");
    expect(pickSphere(scores, "growth", SPHERES)).toBe("growth");
  });
});

describe("порог «Свободного хода»", () => {
  const withR = (resource: number) => {
    const limiting = B.slice(0, 12 - resource).map((q) => [q.id, "H"] as const);
    return run(pattern(Object.fromEntries(limiting)));
  };

  it("9 ресурсных ответов: потолок, 10 и больше: «Свободный ход»", () => {
    expect(withR(9).ceiling).toBe("H");
    expect(withR(10).ceiling).toBe("F");
    expect(withR(11).ceiling).toBe("F");
    expect(withR(12).ceiling).toBe("F");
  });

  it("главное убеждение и сфера определены и при «Свободном ходе»", () => {
    const result = run(pattern({ R2: "W", G3: "W" }), "money");
    expect(result.ceiling).toBe("F");
    expect(result.mainBelief).toBe("W");
    expect(result.mainSphere).toBe("relations");
  });

  it("порог меняется в настройках без правки кода", () => {
    const answers = fullAnswers(pattern({ M1: "B", M2: "B", M3: "B", M4: "B" }));
    expect(computeResult(content, answers, { maxScore: 12, freeThreshold: 8 }).result.ceiling).toBe("F");
    expect(computeResult(content, answers, { maxScore: 12, freeThreshold: 9 }).result.ceiling).toBe("B");
  });
});

describe("полный перебор", () => {
  const CODES: OptionCode[] = [...content.types, "R"];
  const R = CODES.indexOf("R");
  const TIE = ORDER.map((code) => CODES.indexOf(code));
  const CEILINGS: CeilingCode[] = [...content.types, "F"];
  const sphereOf = B.map((q) => SPHERES.indexOf(q.sphere!));

  /**
   * Независимая проверка правил п. 6.4 без сортировки и без кода из lib/scoring.
   * counts: 3 сферы × 4 кода. Возвращает главное убеждение, главную сферу и результат одним числом.
   */
  function expected(counts: Int8Array, chosen: number): number {
    let belief = -1;
    let beliefTotal = -1;
    for (const k of TIE) {
      const total = counts[k] + counts[4 + k] + counts[8 + k];
      const better =
        total > beliefTotal || (total === beliefTotal && counts[chosen * 4 + k] > counts[chosen * 4 + belief]);
      if (better) {
        belief = k;
        beliefTotal = total;
      }
    }
    const limiting = [4 - counts[R], 4 - counts[4 + R], 4 - counts[8 + R]];
    const top = Math.max(limiting[0], limiting[1], limiting[2]);
    const sphere = limiting[chosen] === top ? chosen : limiting.indexOf(top);
    const resource = counts[R] + counts[4 + R] + counts[8 + R];
    const ceiling = resource >= 10 ? 3 : belief;
    return 1 + belief + 3 * sphere + 9 * ceiling;
  }

  const encode = (result: { mainBelief: BeliefCode; mainSphere: Sphere; ceiling: CeilingCode }) =>
    1 + CODES.indexOf(result.mainBelief) + 3 * SPHERES.indexOf(result.mainSphere) + 9 * CEILINGS.indexOf(result.ceiling);

  it("все 4^12 наборов ответов блока B при каждой сфере из A1 дают результат по правилам", () => {
    expect(B).toHaveLength(12);
    // Результат зависит только от числа ответов каждого кода в каждой сфере:
    // lib/scoring вызывается один раз на каждое такое состояние, сверяется каждый набор
    const table = new Int8Array(125 ** 3 * 3);
    const counts = new Int8Array(12);
    const digits = new Int8Array(12);
    let total = 0;
    let states = 0;
    let bad = 0;

    for (;;) {
      counts.fill(0);
      for (let i = 0; i < 12; i++) counts[sphereOf[i] * 4 + digits[i]]++;
      const state =
        ((counts[0] * 25 + counts[1] * 5 + counts[2]) * 125 + (counts[4] * 25 + counts[5] * 5 + counts[6])) * 125 +
        (counts[8] * 25 + counts[9] * 5 + counts[10]);

      for (let chosen = 0; chosen < 3; chosen++) {
        const key = state * 3 + chosen;
        if (table[key] === 0) {
          const at = (sphere: number, code: number) => counts[sphere * 4 + code];
          const sum = (code: number) => at(0, code) + at(1, code) + at(2, code);
          const result = buildResult(
            {
              scores: { H: sum(0), B: sum(1), W: sum(2), R: sum(3) },
              sphereScores: { money: 4 - at(0, R), relations: 4 - at(1, R), growth: 4 - at(2, R) },
              inChosenSphere: { H: at(chosen, 0), B: at(chosen, 1), W: at(chosen, 2) },
              chosenSphere: SPHERES[chosen],
            },
            content,
            OPTS,
          );
          table[key] = encode(result);
          states++;
        }
        if (table[key] !== expected(counts, chosen)) bad++;
      }
      total++;

      let i = 0;
      while (i < 12 && digits[i] === 3) digits[i++] = 0;
      if (i === 12) break;
      digits[i]++;
    }

    expect(CODES).toEqual(["H", "B", "W", "R"]);
    expect(SPHERES).toEqual(["money", "relations", "growth"]);
    expect(total).toBe(16_777_216);
    expect(states).toBe(35 ** 3 * 3);
    expect(bad).toBe(0);
  });

  it("полный путь от идентификаторов ответов: выборка из 4^12 наборов", () => {
    const counts = new Int8Array(12);
    let checked = 0;
    let bad = 0;
    for (let n = 0; n < 4 ** 12; n += 3989) {
      counts.fill(0);
      const answers = fullAnswers();
      let rest = n;
      for (let i = 0; i < 12; i++) {
        const digit = rest % 4;
        rest = Math.floor(rest / 4);
        counts[sphereOf[i] * 4 + digit]++;
        answers[B[i].id] = B[i].options.find((o) => o.code === CODES[digit])!.id;
      }
      const chosen = checked % 3;
      answers.A1 = `A1_${SPHERES[chosen]}`;
      const { result } = computeResult(content, answers, OPTS);
      const sums = [0, 1, 2, 3].map((k) => counts[k] + counts[4 + k] + counts[8 + k]);
      if (encode(result) !== expected(counts, chosen)) bad++;
      if (result.scores.H !== sums[0] || result.scores.B !== sums[1] || result.scores.W !== sums[2] || result.scores.R !== sums[3]) bad++;
      checked++;
    }
    expect(checked).toBeGreaterThan(4000);
    expect(bad).toBe(0);
  });
});
