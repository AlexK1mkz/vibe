import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/**
 * Лид теста «Стеклянный потолок» (ТЗ v2, раздел 9).
 * ceiling: H | B | W | F (F = «Свободный ход»: 10 и больше ресурсных ответов).
 */
export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    createdAt: ts("created_at").notNull().defaultNow(),
    name: text("name"),
    whatsapp: text("whatsapp"),
    consentAt: ts("consent_at"),
    /** Сфера, выбранная в вопросе A1 */
    sphere: text("sphere"),
    cost: text("cost").notNull(),
    goal: text("goal").notNull(),
    goalText: text("goal_text"),
    occupation: text("occupation").notNull(),
    incomeBand: text("income_band").notNull(),
    /** Баллы {H, B, W, R} */
    scores: jsonb("scores").$type<Record<string, number>>().notNull(),
    /** Ограничивающие ответы по сферам {money, relations, growth} */
    sphereScores: jsonb("sphere_scores").$type<Record<string, number>>(),
    /** Название результата: H, B, W или F */
    ceiling: text("ceiling"),
    /** Главное убеждение H, B или W. Заполнено и при «Свободном ходе» */
    mainBelief: text("main_belief"),
    mainSphere: text("main_sphere"),
    segment: text("segment").notNull(),
    /** Лид для личного звонка: доход от порога priority */
    priority: boolean("priority").notNull().default(false),
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
    /** Когда строка последний раз записана в Google Таблицу. null = ждёт записи или повтора */
    sheetsSyncedAt: ts("sheets_synced_at"),
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

/** Анкета специалиста (ТЗ v2, раздел 8.3) */
export const specialistApplications = pgTable("specialist_applications", {
  id: text("id").primaryKey(),
  createdAt: ts("created_at").notNull().defaultNow(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  /** Город и часовой пояс */
  city: text("city"),
  /** practitioner | master | trainer */
  role: text("role"),
  /** Где и когда учились */
  education: text("education").notNull(),
  /** Кем выдан сертификат */
  certificate: text("certificate"),
  practiceHours: text("practice_hours").notNull(),
  weeklyHours: text("weekly_hours").notNull(),
  profileUrl: text("profile_url"),
  /** Зачем вам это, до 300 символов */
  motivation: text("motivation"),
  /** Заявки тренеров помечаются приоритетом */
  priority: boolean("priority").notNull().default(false),
  status: text("status").notNull().default("new"),
  consentAt: ts("consent_at"),
  sheetsSyncedAt: ts("sheets_synced_at"),
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

/**
 * DDL выполняется при первом обращении к базе. Идемпотентно.
 *
 * Миграция с версии 1 (тест «Архетип личности») сделана совместимой назад: новые поля
 * добавляются, а старые (job, primary_archetype, secondary_archetype, is_pair, level)
 * становятся необязательными и не удаляются. Так версия 1 продолжает работать на той же
 * базе, пока версия 2 проверяется на превью. Удалить старые поля можно после слияния в main:
 *   ALTER TABLE leads DROP COLUMN job, DROP COLUMN primary_archetype,
 *     DROP COLUMN secondary_archetype, DROP COLUMN is_pair;
 *   ALTER TABLE specialist_applications DROP COLUMN level;
 */
export const DDL = `
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  public_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text,
  whatsapp text,
  consent_at timestamptz,
  sphere text,
  cost text NOT NULL,
  goal text NOT NULL,
  goal_text text,
  occupation text NOT NULL,
  income_band text NOT NULL,
  scores jsonb NOT NULL,
  sphere_scores jsonb,
  ceiling text,
  main_belief text,
  main_sphere text,
  segment text NOT NULL,
  priority boolean NOT NULL DEFAULT false,
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
  sheets_synced_at timestamptz,
  whatsapp_opt_out boolean NOT NULL DEFAULT false
);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sphere text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sphere_scores jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ceiling text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS main_belief text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS main_sphere text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority boolean NOT NULL DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sheets_synced_at timestamptz;
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
  city text,
  role text,
  education text NOT NULL,
  certificate text,
  practice_hours text NOT NULL,
  weekly_hours text NOT NULL,
  profile_url text,
  motivation text,
  priority boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new',
  consent_at timestamptz,
  sheets_synced_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text
);
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS certificate text;
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS profile_url text;
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS motivation text;
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS priority boolean NOT NULL DEFAULT false;
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE specialist_applications ADD COLUMN IF NOT EXISTS sheets_synced_at timestamptz;

DO $$
DECLARE
  old record;
BEGIN
  FOR old IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND is_nullable = 'NO'
      AND ((table_name = 'leads' AND column_name IN ('job', 'primary_archetype', 'secondary_archetype', 'is_pair'))
        OR (table_name = 'specialist_applications' AND column_name = 'level'))
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', old.table_name, old.column_name);
  END LOOP;
END $$;

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
