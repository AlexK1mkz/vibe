import { after, NextResponse } from "next/server";
import { afterContact, saveContact } from "@/lib/leads";
import { normalizePhone } from "@/lib/phone";
import { cleanText, clientIp, rateLimited } from "@/lib/server-utils";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  if (rateLimited(`contact:${clientIp(request.headers)}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (body.website) return NextResponse.json({ ok: true });

  const name = cleanText(body.name, 80);
  const whatsapp = normalizePhone(String(body.whatsapp ?? ""));
  const errors: Record<string, string> = {};
  if (!name || name.length < 2) errors.name = "name";
  if (!whatsapp) errors.whatsapp = "whatsapp";
  if (body.consent !== true) errors.consent = "consent";
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });
  }

  try {
    const saved = await saveContact(publicId, { name: name!, whatsapp: whatsapp! });
    if (!saved) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (saved.changed) after(() => afterContact(saved.lead));
    return NextResponse.json({ ok: true, publicId: saved.lead.publicId });
  } catch (error) {
    console.error("[api/contact]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
