import { describe, expect, it } from "vitest";
import { funnel, type IncomeBand } from "@/config/funnel";
import { test as content } from "@/lib/content";
import { priorityFor, segmentFor } from "@/lib/segment";

const BANDS: IncomeBand[] = ["lt250", "250_500", "500_1000", "1000_5000", "gte5000", "na"];
const values = (id: string) => content.questions.find((q) => q.id === id)!.options.map((o) => o.value!);

describe("сегментация", () => {
  it("pro: «Работаю с людьми» или «Уже учились НЛП», доход не важен", () => {
    for (const occupation of ["people", "nlp"]) {
      for (const incomeBand of BANDS) expect(segmentFor({ occupation, incomeBand })).toBe("pro");
    }
  });

  it("A: доход не ниже порога 500 000 ₸", () => {
    for (const occupation of ["entrepreneur", "manager", "employee", "student"]) {
      expect(segmentFor({ occupation, incomeBand: "500_1000" })).toBe("A");
      expect(segmentFor({ occupation, incomeBand: "1000_5000" })).toBe("A");
      expect(segmentFor({ occupation, incomeBand: "gte5000" })).toBe("A");
    }
  });

  it("B: ниже порога, без ответа о доходе и неизвестный диапазон", () => {
    expect(segmentFor({ occupation: "manager", incomeBand: "250_500" })).toBe("B");
    expect(segmentFor({ occupation: "manager", incomeBand: "lt250" })).toBe("B");
    expect(segmentFor({ occupation: "manager", incomeBand: "na" })).toBe("B");
    expect(segmentFor({ occupation: "manager", incomeBand: "gte1000" })).toBe("B");
  });

  it("priority: доход от 1 000 000 ₸, независимо от сегмента", () => {
    expect(BANDS.map((band) => priorityFor(band))).toEqual([false, false, false, true, true, false]);
    // Сегмент pro с высоким доходом остаётся pro и получает пометку приоритета
    expect(segmentFor({ occupation: "nlp", incomeBand: "gte5000" })).toBe("pro");
    expect(priorityFor("gte5000")).toBe(true);
    expect(priorityFor("unknown")).toBe(false);
  });

  it("пороги меняются в конфиге без правки кода", () => {
    const high = { ...funnel.segmentation, incomeThreshold: 1_000_000, priorityThreshold: 5_000_000 };
    expect(segmentFor({ occupation: "manager", incomeBand: "500_1000" }, high)).toBe("B");
    expect(segmentFor({ occupation: "manager", incomeBand: "1000_5000" }, high)).toBe("A");
    expect(priorityFor("1000_5000", high)).toBe(false);
    expect(priorityFor("gte5000", high)).toBe(true);
    const low = { ...funnel.segmentation, incomeThreshold: 250_000, priorityThreshold: 500_000 };
    expect(segmentFor({ occupation: "manager", incomeBand: "250_500" }, low)).toBe("A");
    expect(priorityFor("500_1000", low)).toBe(true);
    const other = { ...funnel.segmentation, proOccupations: ["manager"] };
    expect(segmentFor({ occupation: "manager", incomeBand: "na" }, other)).toBe("pro");
    expect(segmentFor({ occupation: "people", incomeBand: "na" }, other)).toBe("B");
  });

  it("конфиг покрывает все варианты вопросов D1 и D2", () => {
    expect(Object.keys(funnel.segmentation.incomeBandMin).sort()).toEqual([...values("D2")].sort());
    for (const occupation of funnel.segmentation.proOccupations) expect(values("D1")).toContain(occupation);
    expect(funnel.segmentation.incomeThreshold).toBe(500_000);
    expect(funnel.segmentation.priorityThreshold).toBe(1_000_000);
  });
});
