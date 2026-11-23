import questionsJson from "@/content/test/questions.json";
import resultsJson from "@/content/test/results.json";

/** Тип ограничивающего убеждения: безнадёжность, беспомощность, недостойность (ТЗ v2, п. 6.2) */
export type BeliefCode = "H" | "B" | "W";
/** Код варианта в блоке B: убеждение или ресурсный ответ */
export type OptionCode = BeliefCode | "R";
/** Название результата: один из трёх потолков или F, «Свободный ход» */
export type CeilingCode = BeliefCode | "F";
export type Sphere = "money" | "relations" | "growth";
export type Cost = "money" | "time" | "relations" | "energy";
export type Goal = "price" | "heard" | "decide" | "speak";
export type TextStatus = "draft" | "approved";

export interface TestOption {
  id: string;
  text: string;
  value?: string;
  code?: OptionCode;
}

export interface TestQuestion {
  id: string;
  block: "A" | "B" | "C" | "D";
  text: string;
  hint?: string;
  /** Сфера вопроса блока B */
  sphere?: Sphere;
  sets?: "sphere" | "cost" | "goal" | "occupation" | "incomeBand";
  freeText?: { maxLength: number; label: string; placeholder?: string };
  options: TestOption[];
}

export interface TestContent {
  version: number;
  types: BeliefCode[];
  tieOrder: BeliefCode[];
  spheres: Sphere[];
  questions: TestQuestion[];
}

interface TextUnit {
  status: TextStatus;
  text: string;
}
interface ListUnit {
  status: TextStatus;
  items: string[];
}

export interface CeilingContent {
  name: string;
  /** Как убеждение звучит внутри, в кавычках */
  voice: string;
  core: { status: TextStatus; tagline: string; sounds: string; helped: string[] };
  technique: { status: TextStatus; title: string; steps: string[] };
  inSphere: Record<Sphere, TextUnit>;
  possible: Record<Goal, ListUnit>;
}

export interface ResultsContent {
  disclaimer: TextUnit;
  cost: Record<Cost, TextUnit>;
  spheres: Record<Sphere, { name: string; in: string }>;
  ceilings: Record<CeilingCode, CeilingContent>;
}

export const test = questionsJson as unknown as TestContent;
export const results = resultsJson as unknown as ResultsContent;

export const TOTAL_QUESTIONS = test.questions.length;
export const CEILING_CODES: readonly CeilingCode[] = [...test.types, "F"];

export function isCeiling(code: unknown): code is CeilingCode {
  return typeof code === "string" && Object.hasOwn(results.ceilings, code);
}

export function isSphere(value: unknown): value is Sphere {
  return typeof value === "string" && Object.hasOwn(results.spheres, value);
}

/** Название результата. Неизвестный код (старая запись) возвращается как есть */
export function ceilingName(code: string | null | undefined): string {
  return isCeiling(code) ? results.ceilings[code].name : (code ?? "");
}

export function sphereName(sphere: string | null | undefined): string {
  return isSphere(sphere) ? results.spheres[sphere].name : (sphere ?? "");
}

/** Сколько текстовых блоков ещё в статусе draft: счётчик для админки (ТЗ v2, п. 6.6) */
export function countDrafts(content: ResultsContent = results): { draft: number; total: number } {
  let draft = 0;
  let total = 0;
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const rec = node as Record<string, unknown>;
    if (typeof rec.status === "string") {
      total += 1;
      if (rec.status !== "approved") draft += 1;
    }
    for (const value of Object.values(rec)) visit(value);
  };
  visit(content);
  return { draft, total };
}
