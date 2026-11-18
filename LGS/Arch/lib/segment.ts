import { funnel, type IncomeBand, type Segment } from "@/config/funnel";

export interface SegmentRules {
  incomeThreshold: number;
  incomeBandMin: Record<IncomeBand, number | null>;
  specialist: { occupation: string; job: string };
}

/**
 * Правила сегментации (ТЗ, п. 7.1):
 *   specialist: D1 = «работаю с людьми» И job = profession
 *   A:          доход ≥ порог
 *   B:          все остальные, включая «не готов(а) отвечать»
 */
export function segmentFor(
  input: { occupation: string; job: string; incomeBand: string },
  rules: SegmentRules = funnel.segmentation,
): Segment {
  if (input.occupation === rules.specialist.occupation && input.job === rules.specialist.job) {
    return "specialist";
  }
  const min = rules.incomeBandMin[input.incomeBand as IncomeBand];
  if (typeof min === "number" && min >= rules.incomeThreshold) return "A";
  return "B";
}
