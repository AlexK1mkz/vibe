import questionsJson from "@/content/test/questions.json";
import resultsJson from "@/content/test/results.json";

export type ArchetypeCode = "S" | "D" | "N" | "V" | "O" | "B";
export type Job = "money" | "team" | "family" | "state" | "profession";
export type Cost = "money" | "time" | "relations" | "energy";
export type Goal = "price" | "heard" | "decide" | "speak" | "profession";
export type TextStatus = "draft" | "approved";

export interface TestOption {
  id: string;
  text: string;
  value?: string;
  archetype?: ArchetypeCode;
}

export interface TestQuestion {
  id: string;
  block: "A" | "B" | "C" | "D";
  text: string;
  hint?: string;
  sets?: "job" | "cost" | "goal" | "occupation" | "incomeBand";
  freeText?: { maxLength: number; label: string; placeholder?: string };
  options: TestOption[];
}

export interface TestContent {
  version: number;
  archetypes: ArchetypeCode[];
  tieOrder: ArchetypeCode[];
  pressureQuestions: string[];
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

export interface ArchetypeContent {
  name: string;
  core: { status: TextStatus; tagline: string; strength: string; how: string; works: string[] };
  technique: { status: TextStatus; title: string; steps: string[] };
  blindZone: Record<Job, TextUnit>;
  possible: Record<Goal, ListUnit>;
}

export interface ResultsContent {
  disclaimer: TextUnit;
  pairNote: TextUnit;
  cost: Record<Cost, TextUnit>;
  archetypes: Record<ArchetypeCode, ArchetypeContent>;
}

export const test = questionsJson as unknown as TestContent;
export const results = resultsJson as unknown as ResultsContent;

export const TOTAL_QUESTIONS = test.questions.length;

export function archetypeName(code: ArchetypeCode): string {
  return results.archetypes[code].name;
}

/** Сколько текстовых блоков ещё в статусе draft: счётчик для админки (ТЗ, п. 6) */
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
