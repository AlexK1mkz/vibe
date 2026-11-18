import { NextResponse } from "next/server";
import { getLead, recordEvent } from "@/lib/leads";
import { clientIp, rateLimited } from "@/lib/server-utils";

export const runtime = "nodejs";

/** События воронки с клиента. Покупки пишет только вебхук оплаты. */
const ALLOWED = /^(page_view|test_start|test_question_(?:[1-9]|1[0-7])|test_complete|contact_submit|result_view|cta_consult_click|cta_intensive_click|cta_specialists_click|specialist_submit)$/;

export async function POST(request: Request) {
  if (rateLimited(`event:${clientIp(request.headers)}`, 400)) {
    return new NextResponse(null, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !ALLOWED.test(body.name)) {
    return new NextResponse(null, { status: 400 });
  }
  try {
    const lead = typeof body.leadId === "string" ? await getLead(body.leadId) : null;
    const payload =
      body.payload && typeof body.payload === "object" && JSON.stringify(body.payload).length < 2000
        ? (body.payload as Record<string, unknown>)
        : null;
    await recordEvent({
      name: body.name,
      leadId: lead?.id ?? null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 40) : null,
      payload,
    });
  } catch (error) {
    console.error("[api/events]", error);
  }
  return new NextResponse(null, { status: 204 });
}
