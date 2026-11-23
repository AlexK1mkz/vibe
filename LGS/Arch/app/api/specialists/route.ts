import { after, NextResponse } from "next/server";
import { syncSpecialistToSheet } from "@/integrations/sheets";
import { getDb, schema } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { cleanText, clientIp, newId, rateLimited } from "@/lib/server-utils";
import { isSpecialistRole, normalizeProfileUrl, SPECIALIST_LIMITS as LIMITS } from "@/lib/specialists";

export const runtime = "nodejs";

/** Анкета специалиста (ТЗ v2, раздел 8.3): проверка, запись в базу, строка в Google Таблицу */
export async function POST(request: Request) {
  if (rateLimited(`specialist:${clientIp(request.headers)}`, 5)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (body.website) return NextResponse.json({ ok: true });

  const name = cleanText(body.name, LIMITS.name);
  const whatsapp = normalizePhone(String(body.whatsapp ?? ""));
  const city = cleanText(body.city, LIMITS.city);
  const role = isSpecialistRole(body.role) ? body.role : null;
  const education = cleanText(body.education, LIMITS.education);
  const certificate = cleanText(body.certificate, LIMITS.certificate);
  const practiceHours = cleanText(body.practiceHours, LIMITS.practiceHours);
  const weeklyHours = cleanText(body.weeklyHours, LIMITS.weeklyHours);
  const profileUrl = normalizeProfileUrl(body.profileUrl);
  const motivationRaw = typeof body.motivation === "string" ? body.motivation.trim() : "";
  const motivation = cleanText(motivationRaw, LIMITS.motivation);

  const errors: Record<string, string> = {};
  if (!name || name.length < 2) errors.name = "name";
  if (!whatsapp) errors.whatsapp = "whatsapp";
  if (!city) errors.city = "required";
  if (!role) errors.role = "role";
  if (!education) errors.education = "required";
  if (!certificate) errors.certificate = "required";
  if (!practiceHours) errors.practiceHours = "required";
  if (!weeklyHours) errors.weeklyHours = "required";
  if (profileUrl === false) errors.profileUrl = "profileUrl";
  if (!motivation || motivationRaw.length > LIMITS.motivation) errors.motivation = "motivation";
  if (body.consent !== true) errors.consent = "consent";
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });
  }

  const utm = (typeof body.utm === "object" && body.utm ? body.utm : {}) as Record<string, unknown>;
  const u = (key: string) => cleanText(utm[key], 300);

  try {
    const db = await getDb();
    const [row] = await db
      .insert(schema.specialistApplications)
      .values({
        id: newId(),
        name: name!,
        whatsapp: whatsapp!,
        city,
        role,
        education: education!,
        certificate,
        practiceHours: practiceHours!,
        weeklyHours: weeklyHours!,
        profileUrl: profileUrl || null,
        motivation,
        // Тренер потока нужен первым: такие заявки помечаются приоритетом
        priority: role === "trainer",
        consentAt: new Date(),
        utmSource: u("utm_source"),
        utmMedium: u("utm_medium"),
        utmCampaign: u("utm_campaign"),
        utmContent: u("utm_content"),
        utmTerm: u("utm_term"),
      })
      .returning();
    // Таблица не задерживает ответ и не ломает заявку: при ошибке строку повторит крон
    after(() => syncSpecialistToSheet(row));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/specialists]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
