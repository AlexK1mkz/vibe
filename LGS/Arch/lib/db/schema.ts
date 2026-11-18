import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    createdAt: ts("created_at").notNull().defaultNow(),
    name: text("name"),
    whatsapp: text("whatsapp"),
    consentAt: ts("consent_at"),
    job: text("job").notNull(),
    cost: text("cost").notNull(),
    goal: text("goal").notNull(),
    goalText: text("goal_text"),
    occupation: text("occupation").notNull(),
    incomeBand: text("income_band").notNull(),
    scores: jsonb("scores").$type<Record<string, number>>().notNull(),
    primary: text("primary_archetype").notNull(),
    secondary: text("secondary_archetype").notNull(),
    isPair: boolean("is_pair").notNull().default(false),
    segment: text("segment").notNull(),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    fbclid: text("fbclid"),
    referrer: text("referrer"),
    status: text("status").notNull().default("test_done"),
    paidAmount: integer("paid_amount"),
    getcourseSyncedAt: ts("getcourse_synced_at"),
    whatsappOptOut: boolean("whatsapp_opt_out").notNull().default(false),
  },
  (t) => [index("leads_created_idx").on(t.createdAt), index("leads_whatsapp_idx").on(t.whatsapp)],
);

export const answers = pgTable(
  "answers",
  {
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    optionId: text("option_id").notNull(),
    answeredAt: ts("answered_at").notNull().defaultNow(),
  },
  (t) => [index("answers_lead_idx").on(t.leadId)],
);

export const specialistApplications = pgTable("specialist_applications", {
  id: text("id").primaryKey(),
  createdAt: ts("created_at").notNull().defaultNow(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  level: text("level").notNull(),
  education: text("education").notNull(),
  practiceHours: text("practice_hours").notNull(),
  weeklyHours: text("weekly_hours").notNull(),
  consentAt: ts("consent_at"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
});

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    name: text("name").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("events_name_idx").on(t.name), index("events_lead_idx").on(t.leadId)],
);

/** Журнал отправленных сообщений цепочки: одно сообщение уходит лиду один раз */
export const messageLog = pgTable(
  "message_log",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    messageId: text("message_id").notNull(),
    provider: text("provider").notNull(),
    ok: boolean("ok").notNull(),
    detail: text("detail"),
    sentAt: ts("sent_at").notNull().defaultNow(),
  },
  (t) => [index("message_log_lead_idx").on(t.leadId)],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type SpecialistApplication = typeof specialistApplications.$inferSelect;

/** DDL выполняется при первом обращении к базе. Идемпотентно. */
export const DDL = `
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  public_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text,
  whatsapp text,
  consent_at timestamptz,
  job text NOT NULL,
  cost text NOT NULL,
  goal text NOT NULL,
  goal_text text,
  occupation text NOT NULL,
  income_band text NOT NULL,
  scores jsonb NOT NULL,
  primary_archetype text NOT NULL,
  secondary_archetype text NOT NULL,
  is_pair boolean NOT NULL DEFAULT false,
  segment text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  referrer text,
  status text NOT NULL DEFAULT 'test_done',
  paid_amount integer,
  getcourse_synced_at timestamptz,
  whatsapp_opt_out boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at);
CREATE INDEX IF NOT EXISTS leads_whatsapp_idx ON leads (whatsapp);

CREATE TABLE IF NOT EXISTS answers (
  lead_id text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  option_id text NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS answers_lead_idx ON answers (lead_id);

CREATE TABLE IF NOT EXISTS specialist_applications (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  whatsapp text NOT NULL,
  level text NOT NULL,
  education text NOT NULL,
  practice_hours text NOT NULL,
  weekly_hours text NOT NULL,
  consent_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text
);

CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  lead_id text REFERENCES leads(id) ON DELETE CASCADE,
  session_id text,
  name text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_name_idx ON events (name);
CREATE INDEX IF NOT EXISTS events_lead_idx ON events (lead_id);

CREATE TABLE IF NOT EXISTS message_log (
  id text PRIMARY KEY,
  lead_id text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  provider text NOT NULL,
  ok boolean NOT NULL,
  detail text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS message_log_lead_idx ON message_log (lead_id);
`;
