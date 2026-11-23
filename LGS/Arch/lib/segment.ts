import { funnel, type IncomeBand, type Segment } from "@/config/funnel";

export interface SegmentRules {
  /** Доход от этого порога: сегмент A */
  incomeThreshold: number;
  /** Доход от этого порога: лид для личного звонка */
  priorityThreshold: number;
  incomeBandMin: Record<IncomeBand, number | null>;
  /** Значения D1, которые дают сегмент pro */
  proOccupations: readonly string[];
}

function incomeAtLeast(incomeBand: string, threshold: number, rules: SegmentRules): boolean {
  const min = rules.incomeBandMin[incomeBand as IncomeBand];
  return typeof min === "number" && min >= threshold;
}

/**
 * Правила сегментации (ТЗ v2, раздел 7):
 *   pro: D1 = «Работаю с людьми» или «Уже учились НЛП», доход не важен
 *   A:   доход не ниже incomeThreshold
 *   B:   все остальные, включая «предпочитаю не отвечать»
 */
export function segmentFor(
  input: { occupation: string; incomeBand: string },
  rules: SegmentRules = funnel.segmentation,
): Segment {
  if (rules.proOccupations.includes(input.occupation)) return "pro";
  return incomeAtLeast(input.incomeBand, rules.incomeThreshold, rules) ? "A" : "B";
}

/** Лид для личного звонка: доход не ниже priorityThreshold, сегмент не важен */
export function priorityFor(incomeBand: string, rules: SegmentRules = funnel.segmentation): boolean {
  return incomeAtLeast(incomeBand, rules.priorityThreshold, rules);
}
