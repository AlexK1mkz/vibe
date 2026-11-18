import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { funnel, type Product } from "@/config/funnel";
import { markPaid } from "@/lib/leads";

export const runtime = "nodejs";

/**
 * Обратный вебхук GetCourse об оплате. Вызывается из процесса GetCourse:
 *   /api/webhooks/getcourse?secret=...&lead_id={lead_id}&product=consult|intensive|vip&amount={cost}
 * Параметры принимаются и в адресе, и в теле (form или JSON).
 */
async function handle(request: Request) {
  const url = new URL(request.url);
  const params = new Map<string, string>(url.searchParams);
  if (request.method === "POST") {
    const type = request.headers.get("content-type") || "";
    try {
      if (type.includes("application/json")) {
        const json = (await request.json()) as Record<string, unknown>;
        for (const [k, v] of Object.entries(json)) if (v != null) params.set(k, String(v));
      } else {
        const form = await request.formData();
        for (const [k, v] of form) params.set(k, String(v));
      }
    } catch {
      /* тело пустое: используем параметры адреса */
    }
  }

  const expected = process.env.GETCOURSE_WEBHOOK_SECRET;
  if (!expected) return NextResponse.json({ error: "webhook_disabled" }, { status: 503 });
  const given = Buffer.from(params.get("secret") || "");
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const product = params.get("product") as Product;
  const leadId = params.get("lead_id") || "";
  if (!(product in funnel.products) || !leadId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const amountRaw = Number(String(params.get("amount") || "").replace(/[^\d.]/g, ""));
  const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? Math.round(amountRaw) : null;

  const result = await markPaid(leadId, product, amount);
  if (!result) return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, status: result.lead.status, changed: result.changed });
}

export const GET = handle;
export const POST = handle;
