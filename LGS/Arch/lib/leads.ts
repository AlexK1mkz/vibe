import "server-only";
import { and, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { funnel, STATUS_RANK, type LeadStatus, type Product } from "@/config/funnel";
import messagesJson from "@/content/funnel/messages.json";
import { archetypeName, test, type ArchetypeCode } from "@/lib/content";
import { getDb, schema } from "@/lib/db";
import type { Lead } from "@/lib/db/schema";
import { dueMessages, renderMessage, type FunnelMessage } from "@/lib/funnel-schedule";
import { computeResult, type Answers } from "@/lib/scoring";
import { segmentFor } from "@/lib/segment";
import { newId, newPublicId, siteUrl } from "@/lib/server-utils";
import { sendLeadWebhook } from "@/integrations/crm";
import { syncLead } from "@/integrations/getcourse";
import { sendMessage } from "@/integrations/whatsapp";

const { leads, answers: answersTable, events, messageLog } = schema;
const MESSAGES = messagesJson.messages as unknown as FunnelMessage[];

export interface Utm {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
}

const short = (value: unknown, max = 300) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

/** Создаёт лид при показе короткого результата. Контакт дописывается позже (ТЗ, п. 8). */
export async function createLead(input: { answers: Answers; goalText: string | null; utm: Utm }): Promise<Lead> {
  const { result, selections } = computeResult(test, input.answers, {
    maxScore: funnel.test.maxScore,
    pairMaxDiff: funnel.test.pairMaxDiff,
  });
  const db = await getDb();
  const id = newId();
  const [lead] = await db
    .insert(leads)
    .values({
      id,
      publicId: newPublicId(),
      job: selections.job,
      cost: selections.cost,
      goal: selections.goal,
      goalText: input.goalText,
      occupation: selections.occupation,
      incomeBand: selections.incomeBand,
      scores: result.scores,
      primary: result.primary,
      secondary: result.secondary,
      isPair: result.isPair,
      segment: segmentFor(selections),
      utmSource: short(input.utm.utm_source),
      utmMedium: short(input.utm.utm_medium),
      utmCampaign: short(input.utm.utm_campaign),
      utmContent: short(input.utm.utm_content),
      utmTerm: short(input.utm.utm_term),
      fbclid: short(input.utm.fbclid, 500),
      referrer: short(input.utm.referrer, 500),
      status: "test_done",
    })
    .returning();
  await db.insert(answersTable).values(
    test.questions.map((q) => ({ leadId: id, questionId: q.id, optionId: input.answers[q.id] })),
  );
  return lead;
}

export async function getLead(publicId: string): Promise<Lead | null> {
  if (!/^[a-z0-9]{8,32}$/.test(publicId)) return null;
  const db = await getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.publicId, publicId)).limit(1);
  return lead ?? null;
}

export async function recordEvent(input: {
  name: string;
  leadId?: string | null;
  sessionId?: string | null;
  payload?: Record<string, unknown> | null;
}): Promise<void> {
  const db = await getDb();
  await db.insert(events).values({
    id: newId(),
    name: input.name,
    leadId: input.leadId ?? null,
    sessionId: input.sessionId ?? null,
    payload: input.payload ?? null,
  });
}

/** Сохраняет контакт и согласие. Повторная отправка той же формы не создаёт дублей. */
export async function saveContact(
  publicId: string,
  input: { name: string; whatsapp: string },
): Promise<{ lead: Lead; changed: boolean } | null> {
  const lead = await getLead(publicId);
  if (!lead) return null;
  // Контакт уже сохранён: по ссылке на результат его нельзя перезаписать чужим номером
  if (lead.status !== "test_done") return { lead, changed: false };
  const db = await getDb();
  const [updated] = await db
    .update(leads)
    .set({
      name: input.name,
      whatsapp: input.whatsapp,
      consentAt: lead.consentAt ?? new Date(),
      status: "contact_given",
    })
    .where(eq(leads.id, lead.id))
    .returning();
  return { lead: updated, changed: true };
}

/** После контакта: GetCourse, CRM, первое сообщение цепочки. Ошибки интеграций не ломают ответ. */
export async function afterContact(lead: Lead): Promise<void> {
  const db = await getDb();
  try {
    const sync = await syncLead(lead, {
      primary: archetypeName(lead.primary as ArchetypeCode),
      secondary: archetypeName(lead.secondary as ArchetypeCode),
    });
    if (sync.ok && !sync.stub) {
      await db.update(leads).set({ getcourseSyncedAt: new Date() }).where(eq(leads.id, lead.id));
    } else if (!sync.ok) {
      console.error(`[getcourse] лид ${lead.publicId}: ${sync.detail}`);
    }
  } catch (error) {
    console.error("[getcourse]", error);
  }
  await sendLeadWebhook(lead, "contact_given").catch((e) => console.error("[crm]", e));
  await sendDueMessages(lead).catch((e) => console.error("[whatsapp]", e));
}

export function messageVars(lead: Lead): Record<string, string | null> {
  const base = siteUrl();
  return {
    name: lead.name,
    archetype: archetypeName(lead.primary as ArchetypeCode),
    resultUrl: `${base}/result/${lead.publicId}`,
    consultUrl: `${base}/consultation?lead=${lead.publicId}`,
    intensiveUrl: `${base}/intensive?lead=${lead.publicId}`,
    unsubscribeUrl: `${base}/unsubscribe/${lead.publicId}`,
    startTime: funnel.intensive.startTime,
  };
}

/** Отправляет лиду все сообщения, срок которых наступил. Возвращает число отправленных. */
export async function sendDueMessages(lead: Lead, now = new Date()): Promise<number> {
  if (!lead.whatsapp) return 0;
  const db = await getDb();
  const sent = await db
    .select({ messageId: messageLog.messageId })
    .from(messageLog)
    .where(eq(messageLog.leadId, lead.id));
  const due = dueMessages(MESSAGES, lead, new Set(sent.map((s) => s.messageId)), now, funnel.utcOffsetHours);
  let count = 0;
  for (const message of due) {
    const text = renderMessage(message.text, messageVars(lead));
    if (!text) continue; // не хватает реальных данных: сообщение не отправляется
    const result = await sendMessage(lead.whatsapp, message.id, { text });
    await db.insert(messageLog).values({
      id: newId(),
      leadId: lead.id,
      messageId: message.id,
      provider: result.provider,
      ok: result.ok,
      detail: result.detail ?? null,
    });
    if (result.ok) count += 1;
  }
  return count;
}

/** Крон: проходит по лидам с контактом за последние 45 дней */
export async function runFunnel(now = new Date()): Promise<{ leads: number; sent: number }> {
  const db = await getDb();
  const since = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(leads)
    .where(and(isNotNull(leads.whatsapp), eq(leads.whatsappOptOut, false), gte(leads.consentAt, since)));
  let sent = 0;
  for (const lead of rows) sent += await sendDueMessages(lead, now);
  return { leads: rows.length, sent };
}

/** Вебхук оплаты: меняет статус (не понижая), пишет событие, уведомляет CRM */
export async function markPaid(
  publicId: string,
  product: Product,
  amount: number | null,
): Promise<{ lead: Lead; changed: boolean } | null> {
  const lead = await getLead(publicId);
  if (!lead) return null;
  const nextStatus = funnel.products[product].paidStatus as LeadStatus;
  const db = await getDb();
  const sum = amount ?? funnel.products[product].price;
  const eventName = `purchase_${product}`;

  const already = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.leadId, lead.id), eq(events.name, eventName)))
    .limit(1);
  if (already.length > 0) return { lead, changed: false };

  const upgrade = STATUS_RANK[nextStatus] > STATUS_RANK[lead.status as LeadStatus];
  const [updated] = await db
    .update(leads)
    .set({ status: upgrade ? nextStatus : lead.status, paidAmount: (lead.paidAmount ?? 0) + sum })
    .where(eq(leads.id, lead.id))
    .returning();
  await recordEvent({ name: eventName, leadId: lead.id, payload: { amount: sum, currency: "KZT", product } });
  await sendLeadWebhook(updated, eventName).catch((e) => console.error("[crm]", e));
  return { lead: updated, changed: true };
}

export async function setOptOut(publicId: string): Promise<boolean> {
  const lead = await getLead(publicId);
  if (!lead) return false;
  const db = await getDb();
  await db.update(leads).set({ whatsappOptOut: true }).where(eq(leads.id, lead.id));
  await recordEvent({ name: "whatsapp_opt_out", leadId: lead.id });
  return true;
}

/** Удаление лида по запросу: ответы, события и журнал сообщений удаляются каскадом */
export async function deleteLead(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(leads).where(eq(leads.id, id));
}

export async function purchaseEvents(leadId: string) {
  const db = await getDb();
  return db
    .select()
    .from(events)
    .where(
      and(eq(events.leadId, leadId), inArray(events.name, ["purchase_consult", "purchase_intensive", "purchase_vip"])),
    );
}
