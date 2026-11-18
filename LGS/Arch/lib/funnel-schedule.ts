import type { LeadStatus, Product, Segment } from "@/config/funnel";

/** Чистая логика расписания цепочки сообщений. Без базы и сети: покрыта модульными тестами. */

export type MessageWhen =
  | { type: "immediate" }
  | { type: "delay"; minutes: number }
  | { type: "nextDayAt"; time: string }
  | { type: "date"; date: string; time: string };

export interface FunnelMessage {
  id: string;
  enabled: boolean;
  when: MessageWhen;
  segments: Segment[];
  audience: "all" | "unpaid" | "intensive_paid";
  stopAfterPaid?: Product[];
  text: string;
  todo?: string;
}

export interface ScheduleLead {
  segment: string;
  status: string;
  whatsapp: string | null;
  whatsappOptOut: boolean;
  consentAt: Date | null;
}

const HOUR = 60 * 60 * 1000;
/** Просроченное больше чем на сутки сообщение не отправляем: оно уже не к месту */
const STALE_MS = 24 * HOUR;

const PAID: Record<LeadStatus, Product[]> = {
  test_done: [],
  contact_given: [],
  consult_paid: ["consult"],
  intensive_paid: ["intensive"],
  intensive_vip_paid: ["intensive", "vip"],
};

function localToUtc(date: string, time: string, utcOffsetHours: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - utcOffsetHours, mm));
}

export function dueAt(when: MessageWhen, contactAt: Date, utcOffsetHours: number): Date {
  switch (when.type) {
    case "immediate":
      return contactAt;
    case "delay":
      return new Date(contactAt.getTime() + when.minutes * 60 * 1000);
    case "nextDayAt": {
      const local = new Date(contactAt.getTime() + utcOffsetHours * HOUR);
      const next = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1));
      return localToUtc(next.toISOString().slice(0, 10), when.time, utcOffsetHours);
    }
    case "date":
      return localToUtc(when.date, when.time, utcOffsetHours);
  }
}

/** Какие сообщения пора отправить этому лиду прямо сейчас */
export function dueMessages(
  messages: FunnelMessage[],
  lead: ScheduleLead,
  sentIds: ReadonlySet<string>,
  now: Date,
  utcOffsetHours: number,
): FunnelMessage[] {
  if (!lead.whatsapp || !lead.consentAt || lead.whatsappOptOut) return [];
  const status = lead.status as LeadStatus;
  const paid = PAID[status] ?? [];
  if (status === "test_done") return [];

  return messages.filter((message) => {
    if (!message.enabled || sentIds.has(message.id)) return false;
    if (!message.segments.includes(lead.segment as Segment)) return false;
    if (message.stopAfterPaid?.some((product) => paid.includes(product))) return false;
    if (message.audience === "unpaid" && paid.length > 0 && !message.stopAfterPaid) return false;
    if (message.audience === "intensive_paid" && !paid.includes("intensive")) return false;
    const due = dueAt(message.when, lead.consentAt!, utcOffsetHours);
    if (due.getTime() > now.getTime()) return false;
    if (message.when.type !== "immediate" && now.getTime() - due.getTime() > STALE_MS) return false;
    // Дата в календаре раньше, чем человек оставил контакт: не отправляем задним числом
    if (message.when.type === "date" && due.getTime() < lead.consentAt!.getTime()) return false;
    return true;
  });
}

/** Подставляет переменные. Возвращает null, если осталась незаполненная подстановка. */
export function renderMessage(text: string, vars: Record<string, string | null | undefined>): string | null {
  const rendered = text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value ? value : match;
  });
  return /\{\w+\}/.test(rendered) ? null : rendered;
}
