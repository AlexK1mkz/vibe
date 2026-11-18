import { NextResponse } from "next/server";
import { createLead } from "@/lib/leads";
import { AnswersError } from "@/lib/scoring";
import { cleanText, clientIp, LEAD_COOKIE, rateLimited } from "@/lib/server-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (rateLimited(`lead:${clientIp(request.headers)}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.answers !== "object" || body.answers === null) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  // Honeypot: поле скрыто от людей, боты его заполняют. Отвечаем как будто всё хорошо.
  if (body.website) return NextResponse.json({ publicId: "ok" });

  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.answers as Record<string, unknown>)) {
    if (typeof value === "string" && key.length < 10 && value.length < 40) answers[key] = value;
  }

  try {
    const lead = await createLead({
      answers,
      goalText: cleanText(body.goalText, 200),
      utm: typeof body.utm === "object" && body.utm ? body.utm : {},
    });
    const response = NextResponse.json({ publicId: lead.publicId });
    response.cookies.set(LEAD_COOKIE, lead.publicId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
    return response;
  } catch (error) {
    if (error instanceof AnswersError) {
      return NextResponse.json({ error: "invalid_answers", detail: error.message }, { status: 400 });
    }
    console.error("[api/leads]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
