import { describe, expect, it } from "vitest";
import { funnel } from "@/config/funnel";
import { segmentFor } from "@/lib/segment";

describe("сегментация", () => {
  it("specialist: работает с людьми и выбрал профессию, доход не важен", () => {
    expect(segmentFor({ occupation: "people", job: "profession", incomeBand: "gte1000" })).toBe("specialist");
    expect(segmentFor({ occupation: "people", job: "profession", incomeBand: "na" })).toBe("specialist");
  });

  it("только одно из двух условий specialist: сегмент по доходу", () => {
    expect(segmentFor({ occupation: "people", job: "money", incomeBand: "500_1000" })).toBe("A");
    expect(segmentFor({ occupation: "manager", job: "profession", incomeBand: "lt250" })).toBe("B");
  });

  it("A: доход не ниже порога", () => {
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "500_1000" })).toBe("A");
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "gte1000" })).toBe("A");
  });

  it("B: ниже порога и «не готов(а) отвечать»", () => {
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "250_500" })).toBe("B");
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "lt250" })).toBe("B");
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "na" })).toBe("B");
  });

  it("порог меняется в конфиге без правки кода", () => {
    const high = { ...funnel.segmentation, incomeThreshold: 1_000_000 };
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "500_1000" }, high)).toBe("B");
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "gte1000" }, high)).toBe("A");
    const low = { ...funnel.segmentation, incomeThreshold: 250_000 };
    expect(segmentFor({ occupation: "manager", job: "team", incomeBand: "250_500" }, low)).toBe("A");
  });
});
