import type { BeliefCode, CeilingCode, OptionCode, Sphere, TestContent } from "@/lib/content";

/** Баллы трёх убеждений и число ресурсных ответов R */
export type Scores = Record<OptionCode, number>;
export type BeliefScores = Record<BeliefCode, number>;
/** Число ограничивающих ответов (H, B, W) в каждой сфере, от 0 до 4 */
export type SphereScores = Record<Sphere, number>;
export type Answers = Record<string, string>;

export interface TestResult {
  scores: Scores;
  sphereScores: SphereScores;
  /** Тип с максимумом баллов. Определён и при «Свободном ходе» */
  mainBelief: BeliefCode;
  mainSphere: Sphere;
  /** Название результата: главное убеждение или F, если ресурсных ответов не меньше порога */
  ceiling: CeilingCode;
  /** Проценты для диаграммы: типы от максимума баллов (12), сферы от числа вопросов сферы (4) */
  profile: { beliefs: BeliefScores; spheres: SphereScores };
}

export interface Selections {
  sphere: Sphere;
  cost: string;
  goal: string;
  occupation: string;
  incomeBand: string;
}

export interface ScoringOptions {
  /** Максимум баллов одного типа: число вопросов блока B */
  maxScore: number;
  /** Сколько ответов R дают результат «Свободный ход» */
  freeThreshold: number;
  /** Вопросов на сферу. По умолчанию maxScore, делённый на число сфер */
  sphereMax?: number;
}

export class AnswersError extends Error {}

const zero = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

/**
 * Главное убеждение (ТЗ v2, п. 6.4.3):
 * 1) максимум баллов; 2) при равенстве тип, чаще выбранный в сфере из A1;
 * 3) при равенстве и там: порядок tieOrder (B, W, H).
 */
export function pickBelief(
  scores: BeliefScores,
  inChosenSphere: BeliefScores,
  tieOrder: readonly BeliefCode[],
): BeliefCode {
  return [...tieOrder].sort(
    (a, b) =>
      scores[b] - scores[a] ||
      inChosenSphere[b] - inChosenSphere[a] ||
      tieOrder.indexOf(a) - tieOrder.indexOf(b),
  )[0];
}

/**
 * Главная сфера (ТЗ v2, п. 6.4.4): максимум ограничивающих ответов.
 * При равенстве сфера из A1; если она не среди лидеров, первая из лидеров по порядку spheres.
 */
export function pickSphere(sphereScores: SphereScores, chosen: Sphere, order: readonly Sphere[]): Sphere {
  const max = Math.max(...order.map((s) => sphereScores[s]));
  const leaders = order.filter((s) => sphereScores[s] === max);
  return leaders.includes(chosen) ? chosen : leaders[0];
}

export function buildResult(
  input: {
    scores: Scores;
    sphereScores: SphereScores;
    /** Баллы типов только по вопросам сферы из A1 */
    inChosenSphere: BeliefScores;
    chosenSphere: Sphere;
  },
  content: Pick<TestContent, "types" | "tieOrder" | "spheres">,
  opts: ScoringOptions,
): TestResult {
  const { scores, sphereScores } = input;
  const mainBelief = pickBelief(scores, input.inChosenSphere, content.tieOrder);
  const mainSphere = pickSphere(sphereScores, input.chosenSphere, content.spheres);
  const sphereMax = opts.sphereMax ?? opts.maxScore / content.spheres.length;
  const percent = (value: number, max: number) => (max > 0 ? Math.round((value / max) * 100) : 0);
  return {
    scores,
    sphereScores,
    mainBelief,
    mainSphere,
    ceiling: scores.R >= opts.freeThreshold ? "F" : mainBelief,
    profile: {
      beliefs: Object.fromEntries(content.types.map((c) => [c, percent(scores[c], opts.maxScore)])) as BeliefScores,
      spheres: Object.fromEntries(content.spheres.map((s) => [s, percent(sphereScores[s], sphereMax)])) as SphereScores,
    },
  };
}

/** Проверяет ответы и считает результат. Бросает AnswersError, если ответы неполные или чужие. */
export function computeResult(
  test: TestContent,
  answers: Answers,
  opts: ScoringOptions,
): { result: TestResult; selections: Selections } {
  const scores: Scores = { ...zero(test.types), R: 0 };
  const sphereScores = zero(test.spheres);
  const bySphere = Object.fromEntries(test.spheres.map((s) => [s, zero(test.types)])) as Record<Sphere, BeliefScores>;
  const selections: Partial<Record<keyof Selections, string>> = {};

  for (const question of test.questions) {
    const optionId = answers[question.id];
    const option = question.options.find((o) => o.id === optionId);
    if (!option) throw new AnswersError(`Нет ответа на вопрос ${question.id}`);

    if (question.block === "B") {
      const { code } = option;
      const { sphere } = question;
      if (!code || !(code in scores)) throw new AnswersError(`У варианта ${option.id} нет кода`);
      if (!sphere || !(sphere in sphereScores)) throw new AnswersError(`У вопроса ${question.id} нет сферы`);
      scores[code] += 1;
      if (code !== "R") {
        sphereScores[sphere] += 1;
        bySphere[sphere][code] += 1;
      }
    } else if (question.sets && option.value) {
      selections[question.sets] = option.value;
    }
  }

  for (const key of ["sphere", "cost", "goal", "occupation", "incomeBand"] as const) {
    if (!selections[key]) throw new AnswersError(`Не определено поле ${key}`);
  }
  const chosenSphere = selections.sphere as Sphere;
  if (!test.spheres.includes(chosenSphere)) throw new AnswersError(`Неизвестная сфера ${chosenSphere}`);

  return {
    result: buildResult({ scores, sphereScores, inChosenSphere: bySphere[chosenSphere], chosenSphere }, test, opts),
    selections: selections as Selections,
  };
}
