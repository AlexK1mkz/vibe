import "server-only";
import type { Lead } from "@/lib/db/schema";

/** CRM: полный объект лида уходит на LEAD_WEBHOOK_URL при каждом изменении статуса */
export async function sendLeadWebhook(lead: Lead, reason: string): Promise<{ ok: boolean; detail?: string }> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    console.log(`[crm:stub] ${reason}: лид ${lead.publicId}, статус ${lead.status}`);
    return { ok: true, detail: "LEAD_WEBHOOK_URL не задан" };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: reason, lead }),
      signal: AbortSignal.timeout(8000),
    });
    return { ok: response.ok, detail: response.ok ? undefined : `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, detail: String(error) };
  }
}
