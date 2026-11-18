import { describe, expect, it } from "vitest";
import messagesJson from "@/content/funnel/messages.json";
import { dueAt, dueMessages, renderMessage, type FunnelMessage, type ScheduleLead } from "@/lib/funnel-schedule";

const OFFSET = 5; // Asia/Almaty
const messages = messagesJson.messages as unknown as FunnelMessage[];
const enabled = (ids: string[]) => messages.map((m) => (ids.includes(m.id) ? { ...m, enabled: true } : m));

const contactAt = new Date("2026-12-02T09:00:00Z"); // 14:00 по Алматы
const lead = (patch: Partial<ScheduleLead> = {}): ScheduleLead => ({
  segment: "A",
  status: "contact_given",
  whatsapp: "+77001234567",
  whatsappOptOut: false,
  consentAt: contactAt,
  ...patch,
});
const ids = (list: FunnelMessage[]) => list.map((m) => m.id);
const at = (iso: string) => new Date(iso);

describe("расписание цепочки сообщений", () => {
  it("сразу после контакта уходит только ссылка на результат", () => {
    expect(ids(dueMessages(messages, lead(), new Set(), contactAt, OFFSET))).toEqual(["result_link"]);
  });

  it("через час сегмент A получает предложение консультации", () => {
    const now = at("2026-12-02T10:01:00Z");
    expect(ids(dueMessages(messages, lead(), new Set(["result_link"]), now, OFFSET))).toEqual(["consult_offer"]);
    expect(ids(dueMessages(messages, lead({ segment: "B" }), new Set(["result_link"]), now, OFFSET))).toEqual([]);
  });

  it("одно сообщение не отправляется дважды", () => {
    const now = at("2026-12-02T10:01:00Z");
    expect(dueMessages(messages, lead(), new Set(["result_link", "consult_offer"]), now, OFFSET)).toEqual([]);
  });

  it("после отписки цепочка останавливается", () => {
    expect(dueMessages(messages, lead({ whatsappOptOut: true }), new Set(), at("2026-12-02T10:01:00Z"), OFFSET)).toEqual([]);
  });

  it("после оплаты шага его сообщения не уходят", () => {
    const now = at("2026-12-02T10:01:00Z");
    const paid = lead({ status: "consult_paid" });
    expect(ids(dueMessages(messages, paid, new Set(["result_link"]), now, OFFSET))).toEqual([]);
  });

  it("без контакта и согласия сообщений нет", () => {
    expect(dueMessages(messages, lead({ status: "test_done", whatsapp: null, consentAt: null }), new Set(), contactAt, OFFSET)).toEqual([]);
  });

  it("«следующий день, 10:00» считается по времени Алматы", () => {
    expect(dueAt({ type: "nextDayAt", time: "10:00" }, contactAt, OFFSET).toISOString()).toBe("2026-12-03T05:00:00.000Z");
    // Контакт в 23:30 по Алматы 2 декабря: следующий день всё равно 3 декабря
    expect(dueAt({ type: "nextDayAt", time: "10:00" }, at("2026-12-02T18:30:00Z"), OFFSET).toISOString()).toBe(
      "2026-12-03T05:00:00.000Z",
    );
  });

  it("ссылка на эфир 14 декабря уходит только оплатившим интенсив", () => {
    const all = enabled(["broadcast_link"]);
    const now = at("2026-12-14T05:30:00Z");
    const sent = new Set(["result_link", "consult_offer"]);
    expect(ids(dueMessages(all, lead(), sent, now, OFFSET))).toEqual([]);
    expect(ids(dueMessages(all, lead({ status: "intensive_paid" }), sent, now, OFFSET))).toEqual(["broadcast_link"]);
    expect(ids(dueMessages(all, lead({ status: "intensive_vip_paid" }), sent, now, OFFSET))).toEqual(["broadcast_link"]);
  });

  it("сообщение, просроченное больше чем на сутки, не отправляется", () => {
    const now = at("2026-12-04T10:00:00Z");
    expect(ids(dueMessages(messages, lead(), new Set(["result_link"]), now, OFFSET))).toEqual([]);
  });

  it("сообщение без реальных данных не собирается", () => {
    expect(renderMessage("Осталось мест: {seatsLeft}", { seatsLeft: null })).toBeNull();
    expect(renderMessage("{name}, привет", { name: "Алия" })).toBe("Алия, привет");
  });
});
