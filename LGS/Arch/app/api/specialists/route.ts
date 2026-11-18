import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { cleanText, clientIp, newId, rateLimited } from "@/lib/server-utils";

export const runtime = "nodejs";

const LEVELS = ["practitioner", "master", "trainer"];

export async function POST(request: Request) {
  if (rateLimited(`specialist:${clientIp(request.headers)}`, 5)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (body.website) return NextResponse.json({ ok: true });

  const name = cleanText(body.name, 80);
  const whatsapp = normalizePhone(String(body.whatsapp ?? ""));
  const level = LEVELS.includes(body.level) ? (body.level as string) : null;
  const education = cleanText(body.education, 400);
  const practiceHours = cleanText(body.practiceHours, 60);
  const weeklyHours = cleanText(body.weeklyHours, 60);

  const errors: Record<string, string> = {};
  if (!name || name.length < 2) errors.name = "name";
  if (!whatsapp) errors.whatsapp = "whatsapp";
  if (!level) errors.level = "level";
  if (!education) errors.education = "education";
  if (!practiceHours) errors.practiceHours = "practiceHours";
  if (!weeklyHours) errors.weeklyHours = "weeklyHours";
  if (body.consent !== true) errors.consent = "consent";
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });
  }

  const utm = (typeof body.utm === "object" && body.utm ? body.utm : {}) as Record<string, unknown>;
  const u = (key: string) => cleanText(utm[key], 300);

  try {
    const db = await getDb();
    await db.insert(schema.specialistApplications).values({
      id: newId(),
      name: name!,
      whatsapp: whatsapp!,
      level: level!,
      education: education!,
      practiceHours: practiceHours!,
      weeklyHours: weeklyHours!,
      consentAt: new Date(),
      utmSource: u("utm_source"),
      utmMedium: u("utm_medium"),
      utmCampaign: u("utm_campaign"),
      utmContent: u("utm_content"),
      utmTerm: u("utm_term"),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/specialists]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
