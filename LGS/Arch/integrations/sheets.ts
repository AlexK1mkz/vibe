import "server-only";
import { createSign } from "node:crypto";
import { asc, eq, isNull } from "drizzle-orm";
import { funnel } from "@/config/funnel";
import { getDb, schema } from "@/lib/db";
import type { Lead, SpecialistApplication } from "@/lib/db/schema";

/**
 * Google Таблица (ТЗ v2, разделы 7 и 9): каждая заявка пишется строкой в свой лист.
 * Работает через сервисный аккаунт без сторонних библиотек: JWT RS256 → access token → values.append.
 *
 * Переменные окружения:
 *   GOOGLE_SHEETS_ID                идентификатор таблицы из её адреса
 *   GOOGLE_SERVICE_ACCOUNT_JSON     JSON ключа сервисного аккаунта целиком (можно в base64)
 *   GOOGLE_SHEETS_TAB_LEADS         имя листа клиентов, по умолчанию «Клиенты»
 *   GOOGLE_SHEETS_TAB_SPECIALISTS   имя листа специалистов, по умолчанию «Специалисты»
 * Таблицу нужно открыть сервисному аккаунту (client_email) с правом редактора, листы создать заранее.
 * Без переменных работает заглушка: строка уходит в лог.
 *
 * Ошибка записи не ломает заявку: она логируется, sheets_synced_at остаётся null,
 * и строку повторяет крон (retryPendingSpecialists).
 */

export type Cell = string | number | boolean | null;

export interface AppendResult {
  ok: boolean;
  stub: boolean;
  detail?: string;
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API = "https://sheets.googleapis.com/v4/spreadsheets";
const TIMEOUT_MS = 8000;

export const LEAD_HEADER = [
  "Дата",
  "Имя",
  "WhatsApp",
  "Результат",
  "Сфера",
  "Цена",
  "Цель",
  "Род занятий",
  "Доход",
  "Сегмент",
  "Приоритет",
  "UTM source",
  "UTM medium",
  "UTM campaign",
  "Ссылка на результат",
  "Статус",
] as const;

export const SPECIALIST_HEADER = [
  "Дата",
  "Имя",
  "WhatsApp",
  "Город",
  "Роль",
  "Обучение",
  "Сертификат",
  "Часы практики",
  "Часы в неделю",
  "Профиль",
  "Зачем",
  "Приоритет",
  "UTM source",
  "UTM medium",
  "UTM campaign",
  "Статус",
] as const;

const ROLE_LABELS: Record<string, string> = { practitioner: "Практик", master: "Мастер", trainer: "Тренер" };

export function sheetsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SHEETS_ID?.trim() && process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}

export const leadsTab = () => process.env.GOOGLE_SHEETS_TAB_LEADS?.trim() || "Клиенты";
export const specialistsTab = () => process.env.GOOGLE_SHEETS_TAB_SPECIALISTS?.trim() || "Специалисты";

/**
 * Защита от формул: значение, которое начинается с = + - @, получает апостроф в начале.
 * Телефон вида +7XXXXXXXXXX остаётся как есть. Запись идёт с valueInputOption=RAW,
 * апостроф страхует на случай выгрузки листа в CSV и открытия в Excel.
 */
export function escapeCell(value: Cell): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return value;
  if (/^\+7\d{10}$/.test(value)) return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

/** Дата и время в часовом поясе института: 23.11.2026 14:05 */
export function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: funnel.timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")} ${get("hour")}:${get("minute")}`;
}

const yes = (flag: boolean) => (flag ? "да" : "");

/** Строка листа «Специалисты». Порядок колонок = SPECIALIST_HEADER */
export function specialistRow(app: SpecialistApplication): Cell[] {
  return [
    formatDate(app.createdAt),
    app.name,
    app.whatsapp,
    app.city,
    app.role ? (ROLE_LABELS[app.role] ?? app.role) : null,
    app.education,
    app.certificate,
    app.practiceHours,
    app.weeklyHours,
    app.profileUrl,
    app.motivation,
    yes(app.priority),
    app.utmSource,
    app.utmMedium,
    app.utmCampaign,
    app.status,
  ];
}

/** Строка листа «Клиенты». Порядок колонок = LEAD_HEADER */
export function leadRow(lead: Lead, labels: { result: string; sphere: string; resultUrl: string }): Cell[] {
  return [
    formatDate(lead.createdAt),
    lead.name,
    lead.whatsapp,
    labels.result,
    labels.sphere,
    lead.cost,
    lead.goalText ? `${lead.goal}: ${lead.goalText}` : lead.goal,
    lead.occupation,
    lead.incomeBand,
    lead.segment,
    yes(lead.priority),
    lead.utmSource,
    lead.utmMedium,
    lead.utmCampaign,
    labels.resultUrl,
    lead.status,
  ];
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function readServiceAccount(): ServiceAccount {
  let raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (raw && !raw.startsWith("{")) raw = Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("в GOOGLE_SERVICE_ACCOUNT_JSON нет client_email или private_key");
  }
  // В переменной окружения переводы строк ключа часто приходят как литерал \n
  return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

const b64url = (value: string) => Buffer.from(value).toString("base64url");

/** JWT для обмена на access token (RS256, срок жизни 1 час) */
export function buildJwt(account: ServiceAccount, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSec, exp: nowSec + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(account.private_key, "base64url");
  return `${header}.${claims}.${signature}`;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildJwt(readServiceAccount()),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`токен: ${response.status} ${(await response.text()).slice(0, 300)}`);
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("токен: в ответе нет access_token");
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

/** Диапазон в нотации A1: имя листа в одинарных кавычках */
const range = (tab: string, cells: string) => encodeURIComponent(`'${tab.replace(/'/g, "''")}'!${cells}`);

async function sheetsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  const id = encodeURIComponent((process.env.GOOGLE_SHEETS_ID || "").trim());
  const response = await fetch(`${API}/${id}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 300)}`);
  return response;
}

const appendPath = (tab: string) =>
  `values/${range(tab, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

/** Листы, в которых заголовок уже проверен этим процессом */
const headerChecked = new Set<string>();

/** В пустой лист первой строкой пишет заголовок. Ошибка проверки запись заявки не останавливает. */
async function ensureHeader(tab: string): Promise<void> {
  if (headerChecked.has(tab)) return;
  const header = tab === specialistsTab() ? SPECIALIST_HEADER : tab === leadsTab() ? LEAD_HEADER : null;
  if (!header) return;
  try {
    const response = await sheetsFetch(`values/${range(tab, "A1:A1")}`);
    const data = (await response.json()) as { values?: unknown[][] };
    if (!data.values?.length) {
      await sheetsFetch(appendPath(tab), { method: "POST", body: JSON.stringify({ values: [[...header]] }) });
    }
    headerChecked.add(tab);
  } catch (error) {
    console.error(`[sheets] заголовок листа «${tab}»: ${(error as Error).message}`);
  }
}

/** Дописывает строку в конец листа. Без переменных окружения работает как заглушка. */
export async function appendRow(tab: string, values: Cell[]): Promise<AppendResult> {
  const row = values.map(escapeCell);
  if (!sheetsConfigured()) {
    console.log(`[sheets:stub] → «${tab}»: ${JSON.stringify(row)}`);
    return { ok: true, stub: true, detail: "Заглушка: строка записана в лог" };
  }
  try {
    await ensureHeader(tab);
    await sheetsFetch(appendPath(tab), { method: "POST", body: JSON.stringify({ values: [row] }) });
    return { ok: true, stub: false };
  } catch (error) {
    return { ok: false, stub: false, detail: (error as Error).message };
  }
}

/** Пишет анкету специалиста в таблицу. При настоящей записи ставит sheets_synced_at. Не бросает ошибок. */
export async function syncSpecialistToSheet(app: SpecialistApplication): Promise<boolean> {
  try {
    const result = await appendRow(specialistsTab(), specialistRow(app));
    if (!result.ok) {
      console.error(`[sheets] анкета ${app.id}: ${result.detail}`);
      return false;
    }
    if (!result.stub) {
      const db = await getDb();
      await db
        .update(schema.specialistApplications)
        .set({ sheetsSyncedAt: new Date() })
        .where(eq(schema.specialistApplications.id, app.id));
    }
    return true;
  } catch (error) {
    console.error(`[sheets] анкета ${app.id}:`, error);
    return false;
  }
}

/** Пишет лид в таблицу. При настоящей записи ставит sheets_synced_at. Не бросает ошибок. */
export async function syncLeadToSheet(
  lead: Lead,
  labels: { result: string; sphere: string; resultUrl: string },
): Promise<boolean> {
  try {
    const result = await appendRow(leadsTab(), leadRow(lead, labels));
    if (!result.ok) {
      console.error(`[sheets] лид ${lead.publicId}: ${result.detail}`);
      return false;
    }
    if (!result.stub) {
      const db = await getDb();
      await db.update(schema.leads).set({ sheetsSyncedAt: new Date() }).where(eq(schema.leads.id, lead.id));
    }
    return true;
  } catch (error) {
    console.error(`[sheets] лид ${lead.publicId}:`, error);
    return false;
  }
}

/** Крон: повторяет запись анкет, которые ещё не попали в таблицу. Возвращает число записанных. */
export async function retryPendingSpecialists(limit = 20): Promise<number> {
  if (!sheetsConfigured()) return 0;
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.specialistApplications)
      .where(isNull(schema.specialistApplications.sheetsSyncedAt))
      .orderBy(asc(schema.specialistApplications.createdAt))
      .limit(limit);
    let count = 0;
    for (const row of rows) if (await syncSpecialistToSheet(row)) count += 1;
    return count;
  } catch (error) {
    console.error("[sheets] повтор анкет:", error);
    return 0;
  }
}
