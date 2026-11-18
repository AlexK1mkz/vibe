import type { ArchetypeCode, TestContent } from "@/lib/content";

export type Scores = Record<ArchetypeCode, number>;
export type Answers = Record<string, string>;

export interface TestResult {
  scores: Scores;
  /** Сколько раз архетип выбран в вопросах давления (B1, B3, B7, B10) */
  pressure: Scores;
  /** Все шесть архетипов от сильного к слабому */
  ranking: ArchetypeCode[];
  primary: ArchetypeCode;
  secondary: ArchetypeCode;
  /** Разница первого и второго не больше порога: результат подаётся как связка */
  isPair: boolean;
  /** Баллы, делённые на максимум, в процентах */
  profile: Scores;
}

export interface Selections {
  job: string;
  cost: string;
  goal: string;
  occupation: string;
  incomeBand: string;
}

export class AnswersError extends Error {}

function emptyScores(codes: readonly ArchetypeCode[]): Scores {
  return Object.fromEntries(codes.map((c) => [c, 0])) as Scores;
}

/**
 * Упорядочивает архетипы (ТЗ, п. 5.5):
 * 1) больше баллов; 2) при равенстве чаще выбран в вопросах давления;
 * 3) при равенстве и там: порядок tieOrder (S, D, N, V, O, B).
 */
export function rankArchetypes(
  scores: Scores,
  pressure: Scores,
  tieOrder: readonly ArchetypeCode[],
): ArchetypeCode[] {
  return [...tieOrder].sort(
    (a, b) =>
      scores[b] - scores[a] ||
      pressure[b] - pressure[a] ||
      tieOrder.indexOf(a) - tieOrder.indexOf(b),
  );
}

export function buildResult(
  scores: Scores,
  pressure: Scores,
  tieOrder: readonly ArchetypeCode[],
  opts: { maxScore: number; pairMaxDiff: number },
): TestResult {
  const ranking = rankArchetypes(scores, pressure, tieOrder);
  const [primary, secondary] = ranking;
  const profile = Object.fromEntries(
    tieOrder.map((c) => [c, Math.round((scores[c] / opts.maxScore) * 100)]),
  ) as Scores;
  return {
    scores,
    pressure,
    ranking,
    primary,
    secondary,
    isPair: scores[primary] - scores[secondary] <= opts.pairMaxDiff,
    profile,
  };
}

/** Проверяет ответы и считает результат. Бросает AnswersError, если ответы неполные или чужие. */
export function computeResult(
  test: TestContent,
  answers: Answers,
  opts: { maxScore: number; pairMaxDiff: number },
): { result: TestResult; selections: Selections } {
  const scores = emptyScores(test.archetypes);
  const pressure = emptyScores(test.archetypes);
  const selections: Partial<Selections> = {};

  for (const question of test.questions) {
    const optionId = answers[question.id];
    const option = question.options.find((o) => o.id === optionId);
    if (!option) throw new AnswersError(`Нет ответа на вопрос ${question.id}`);

    if (question.block === "B") {
      if (!option.archetype) throw new AnswersError(`У варианта ${option.id} нет архетипа`);
      scores[option.archetype] += 1;
      if (test.pressureQuestions.includes(question.id)) pressure[option.archetype] += 1;
    } else if (question.sets && option.value) {
      selections[question.sets] = option.value;
    }
  }

  for (const key of ["job", "cost", "goal", "occupation", "incomeBand"] as const) {
    if (!selections[key]) throw new AnswersError(`Не определено поле ${key}`);
  }

  return {
    result: buildResult(scores, pressure, test.tieOrder, opts),
    selections: selections as Selections,
  };
}
