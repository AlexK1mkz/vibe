import "server-only";
import { and, desc, eq, like, sql, type SQL } from "drizzle-orm";
import { PAID_STATUSES } from "@/config/funnel";
import { TOTAL_QUESTIONS } from "@/lib/content";
import { getDb, schema } from "@/lib/db";

const { leads, events, specialistApplications } = schema;

export interface LeadFilters {
  segment?: string;
  archetype?: string;
  job?: string;
  status?: string;
  utm?: string;
}

function where(filters: LeadFilters): SQL | undefined {
  const parts: SQL[] = [];
  if (filters.segment) parts.push(eq(leads.segment, filters.segment));
  if (filters.archetype) parts.push(eq(leads.primary, filters.archetype));
  if (filters.job) parts.push(eq(leads.job, filters.job));
  if (filters.status) parts.push(eq(leads.status, filters.status));
  if (filters.utm) parts.push(eq(leads.utmSource, filters.utm));
  return parts.length ? and(...parts) : undefined;
}

export async function listLeads(filters: LeadFilters, limit: number | null = 200) {
  const db = await getDb();
  const query = db.select().from(leads).where(where(filters)).orderBy(desc(leads.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function listApplications(limit = 200) {
  const db = await getDb();
  return db.select().from(specialistApplications).orderBy(desc(specialistApplications.createdAt)).limit(limit);
}

const isPaid = sql`${leads.status} in (${sql.join(PAID_STATUSES.map((s) => sql`${s}`), sql`, `)})`;
const hasContact = sql`${leads.status} <> 'test_done'`;

export interface BreakdownRow {
  key: string;
  total: number;
  contact: number;
  paid: number;
}

async function breakdown(column: typeof leads.segment | typeof leads.primary | typeof leads.job | typeof leads.utmSource) {
  const db = await getDb();
  const rows = await db
    .select({
      key: sql<string>`coalesce(${column}, '—')`,
      total: sql<number>`count(*)`,
      contact: sql<number>`count(*) filter (where ${hasContact})`,
      paid: sql<number>`count(*) filter (where ${isPaid})`,
    })
    .from(leads)
    .groupBy(column)
    .orderBy(sql`count(*) desc`);
  return rows.map((r) => ({ key: r.key, total: Number(r.total), contact: Number(r.contact), paid: Number(r.paid) }));
}

export async function getStats() {
  const db = await getDb();

  const [totals] = await db
    .select({
      completed: sql<number>`count(*)`,
      contact: sql<number>`count(*) filter (where ${hasContact})`,
      paid: sql<number>`count(*) filter (where ${isPaid})`,
    })
    .from(leads);

  const [started] = await db
    .select({ n: sql<number>`count(distinct ${events.sessionId})` })
    .from(events)
    .where(eq(events.name, "test_start"));

  const [clicked] = await db
    .select({ n: sql<number>`count(distinct ${events.leadId})` })
    .from(events)
    .where(like(events.name, "cta_%"));

  const perQuestion = await db
    .select({ name: events.name, n: sql<number>`count(distinct ${events.sessionId})` })
    .from(events)
    .where(like(events.name, "test_question_%"))
    .groupBy(events.name);
  const answered = new Map(perQuestion.map((r) => [Number(r.name.replace("test_question_", "")), Number(r.n)]));

  // Доля отказов на вопросе N: ответили на N−1 (или начали), но не ответили на N
  const questions = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
    const n = i + 1;
    const count = answered.get(n) ?? 0;
    const previous = n === 1 ? count : (answered.get(n - 1) ?? 0);
    return { n, answered: count, dropOff: previous > 0 ? Math.max(0, 1 - count / previous) : 0 };
  });

  const [bySegment, byArchetype, byJob, byUtm] = await Promise.all([
    breakdown(leads.segment),
    breakdown(leads.primary),
    breakdown(leads.job),
    breakdown(leads.utmSource),
  ]);

  return {
    funnel: [
      { key: "started", label: "Начали тест", value: Number(started?.n ?? 0) },
      { key: "completed", label: "Закончили", value: Number(totals?.completed ?? 0) },
      { key: "contact", label: "Оставили контакт", value: Number(totals?.contact ?? 0) },
      { key: "clicked", label: "Кликнули", value: Number(clicked?.n ?? 0) },
      { key: "paid", label: "Оплатили", value: Number(totals?.paid ?? 0) },
    ],
    questions,
    bySegment,
    byArchetype,
    byJob,
    byUtm,
  };
}
