import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// База в этих тестах не нужна: проверяем сборку строк и заглушку
vi.mock("@/lib/db", () => ({
  getDb: async () => {
    throw new Error("в тесте sheets база не используется");
  },
  schema: {},
}));

import type { Lead, SpecialistApplication } from "@/lib/db/schema";
import {
  appendRow,
  buildJwt,
  escapeCell,
  LEAD_HEADER,
  leadRow,
  retryPendingSpecialists,
  sheetsConfigured,
  SPECIALIST_HEADER,
  specialistRow,
  syncSpecialistToSheet,
} from "@/integrations/sheets";
import { normalizeProfileUrl } from "@/lib/specialists";

const ENV = ["GOOGLE_SHEETS_ID", "GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SHEETS_TAB_LEADS", "GOOGLE_SHEETS_TAB_SPECIALISTS"];

const application: SpecialistApplication = {
  id: "app-1",
  // 09:05 UTC = 14:05 в Алматы (UTC+5)
  createdAt: new Date("2026-11-23T09:05:00Z"),
  name: "Айгерим",
  whatsapp: "+77001112233",
  city: "Алматы, UTC+5",
  role: "trainer",
  education: "Тестовая школа, 2020",
  certificate: "Тестовая школа",
  practiceHours: "200",
  weeklyHours: "10",
  profileUrl: "https://instagram.com/test",
  motivation: "=HYPERLINK(\"http://example.com\")",
  priority: true,
  status: "new",
  consentAt: new Date("2026-11-23T09:05:00Z"),
  sheetsSyncedAt: null,
  utmSource: "instagram",
  utmMedium: "cpc",
  utmCampaign: "specialists",
  utmContent: null,
  utmTerm: null,
};

const lead = {
  id: "lead-1",
  publicId: "abcdefgh234567",
  createdAt: new Date("2026-11-23T20:30:00Z"),
  name: "Данияр",
  whatsapp: "+77051234567",
  cost: "money",
  goal: "price",
  goalText: "Поднять цену",
  occupation: "owner",
  incomeBand: "gte1000",
  segment: "A",
  priority: true,
  utmSource: "instagram",
  utmMedium: "manychat",
  utmCampaign: "потолок",
  status: "contact_given",
} as unknown as Lead;

describe("Google Таблица: заголовки и строки", () => {
  it("заголовки листов идут в порядке из ТЗ", () => {
    expect([...LEAD_HEADER]).toEqual([
      "Дата", "Имя", "WhatsApp", "Результат", "Сфера", "Цена", "Цель", "Род занятий", "Доход",
      "Сегмент", "Приоритет", "UTM source", "UTM medium", "UTM campaign", "Ссылка на результат", "Статус",
    ]);
    expect([...SPECIALIST_HEADER]).toEqual([
      "Дата", "Имя", "WhatsApp", "Город", "Роль", "Обучение", "Сертификат", "Часы практики", "Часы в неделю",
      "Профиль", "Зачем", "Приоритет", "UTM source", "UTM medium", "UTM campaign", "Статус",
    ]);
  });

  it("строка специалиста совпадает с заголовком по длине и порядку", () => {
    const row = specialistRow(application);
    expect(row).toHaveLength(SPECIALIST_HEADER.length);
    const byHeader = Object.fromEntries(SPECIALIST_HEADER.map((title, i) => [title, row[i]]));
    expect(byHeader).toMatchObject({
      "Дата": "23.11.2026 14:05",
      "Имя": "Айгерим",
      "WhatsApp": "+77001112233",
      "Город": "Алматы, UTC+5",
      "Роль": "Тренер",
      "Обучение": "Тестовая школа, 2020",
      "Сертификат": "Тестовая школа",
      "Часы практики": "200",
      "Часы в неделю": "10",
      "Профиль": "https://instagram.com/test",
      "Приоритет": "да",
      "UTM source": "instagram",
      "UTM medium": "cpc",
      "UTM campaign": "specialists",
      "Статус": "new",
    });
  });

  it("пустые поля и обычный приоритет дают пустые ячейки", () => {
    const row = specialistRow({ ...application, role: "practitioner", priority: false, profileUrl: null, utmSource: null });
    const cells = row.map(escapeCell);
    expect(cells[SPECIALIST_HEADER.indexOf("Роль")]).toBe("Практик");
    expect(cells[SPECIALIST_HEADER.indexOf("Приоритет")]).toBe("");
    expect(cells[SPECIALIST_HEADER.indexOf("Профиль")]).toBe("");
    expect(cells[SPECIALIST_HEADER.indexOf("UTM source")]).toBe("");
  });

  it("строка лида совпадает с заголовком по длине и порядку", () => {
    const row = leadRow(lead, {
      result: "Потолок права",
      sphere: "Деньги",
      resultUrl: "https://example.com/result/abcdefgh234567",
    });
    expect(row).toHaveLength(LEAD_HEADER.length);
    const byHeader = Object.fromEntries(LEAD_HEADER.map((title, i) => [title, row[i]]));
    expect(byHeader).toEqual({
      // 20:30 UTC = 01:30 следующего дня в Алматы
      "Дата": "24.11.2026 01:30",
      "Имя": "Данияр",
      "WhatsApp": "+77051234567",
      "Результат": "Потолок права",
      "Сфера": "Деньги",
      "Цена": "money",
      "Цель": "price: Поднять цену",
      "Род занятий": "owner",
      "Доход": "gte1000",
      "Сегмент": "A",
      "Приоритет": "да",
      "UTM source": "instagram",
      "UTM medium": "manychat",
      "UTM campaign": "потолок",
      "Ссылка на результат": "https://example.com/result/abcdefgh234567",
      "Статус": "contact_given",
    });
  });
});

describe("Google Таблица: экранирование формул", () => {
  it("значения с = + - @ в начале получают апостроф", () => {
    expect(escapeCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(escapeCell("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
    expect(escapeCell("-2+3")).toBe("'-2+3");
    expect(escapeCell("@handle")).toBe("'@handle");
  });

  it("телефон вида +7XXXXXXXXXX не экранируется, другие номера с плюсом экранируются", () => {
    expect(escapeCell("+77001112233")).toBe("+77001112233");
    expect(escapeCell("+7700111223")).toBe("'+7700111223");
    expect(escapeCell("+77001112233=1")).toBe("'+77001112233=1");
  });

  it("обычный текст, числа, логические значения и null", () => {
    expect(escapeCell("Алматы, UTC+5")).toBe("Алматы, UTC+5");
    expect(escapeCell("a=b")).toBe("a=b");
    expect(escapeCell(42)).toBe(42);
    expect(escapeCell(true)).toBe(true);
    expect(escapeCell(null)).toBe("");
  });

  it("опасное значение из анкеты экранируется в готовой строке", () => {
    const cells = specialistRow(application).map(escapeCell);
    expect(cells[SPECIALIST_HEADER.indexOf("Зачем")]).toBe("'=HYPERLINK(\"http://example.com\")");
    expect(cells[SPECIALIST_HEADER.indexOf("WhatsApp")]).toBe("+77001112233");
  });
});

describe("Google Таблица: заглушка без переменных окружения", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });
  afterEach(() => {
    for (const key of ENV) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    vi.restoreAllMocks();
  });

  it("sheetsConfigured требует обе переменные", () => {
    expect(sheetsConfigured()).toBe(false);
    process.env.GOOGLE_SHEETS_ID = "sheet-id";
    expect(sheetsConfigured()).toBe(false);
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = "{}";
    expect(sheetsConfigured()).toBe(true);
  });

  it("appendRow пишет в лог и не ходит в сеть", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await appendRow("Специалисты", ["=1", "+77001112233", null]);
    expect(result).toMatchObject({ ok: true, stub: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0][0])).toContain("«Специалисты»");
    expect(String(log.mock.calls[0][0])).toContain(JSON.stringify(["'=1", "+77001112233", ""]));
  });

  it("syncSpecialistToSheet в режиме заглушки успешен и не трогает базу", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(syncSpecialistToSheet(application)).resolves.toBe(true);
    expect(error).not.toHaveBeenCalled();
  });

  it("retryPendingSpecialists без настроенной таблицы ничего не делает", async () => {
    await expect(retryPendingSpecialists()).resolves.toBe(0);
  });

  it("ошибка сети не бросает исключение: ok = false и текст ошибки", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    process.env.GOOGLE_SHEETS_ID = "sheet-id";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "robot@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("сеть недоступна"));
    const result = await appendRow("Специалисты", ["x"]);
    expect(result).toEqual({ ok: false, stub: false, detail: "сеть недоступна" });
  });
});

describe("Google Таблица: JWT сервисного аккаунта", () => {
  it("подпись RS256 проверяется открытым ключом, ключ с литералом \\n читается", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
    const jwt = buildJwt({ client_email: "robot@example.iam.gserviceaccount.com", private_key: pem }, 1_800_000_000);
    const [header, claims, signature] = jwt.split(".");
    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(claims, "base64url").toString())).toEqual({
      iss: "robot@example.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_800_000_000,
      exp: 1_800_003_600,
    });
    expect(createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, signature, "base64url")).toBe(true);
  });
});

describe("анкета специалиста: ссылка на профиль", () => {
  it("пустое значение допустимо, адрес дополняется протоколом, ник остаётся", () => {
    expect(normalizeProfileUrl("")).toBeNull();
    expect(normalizeProfileUrl("  ")).toBeNull();
    expect(normalizeProfileUrl(undefined)).toBeNull();
    expect(normalizeProfileUrl("instagram.com/test")).toBe("https://instagram.com/test");
    expect(normalizeProfileUrl("https://t.me/test")).toBe("https://t.me/test");
    expect(normalizeProfileUrl("@test.name")).toBe("@test.name");
  });

  it("не адрес и не ник отклоняются", () => {
    expect(normalizeProfileUrl("просто текст")).toBe(false);
    expect(normalizeProfileUrl("javascript:alert(1)")).toBe(false);
    expect(normalizeProfileUrl("localhost")).toBe(false);
    expect(normalizeProfileUrl(42)).toBe(false);
  });
});
