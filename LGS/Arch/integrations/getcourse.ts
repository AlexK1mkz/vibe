import "server-only";
import { funnel, type Product } from "@/config/funnel";
import type { Lead } from "@/lib/db/schema";

/**
 * Адаптер GetCourse.
 * 1) syncLead: создаёт или обновляет пользователя с полями теста (API импорта пользователей).
 * 2) paymentUrl: ссылка на страницу заказа с lead_id и UTM. Оплата идёт на стороне GetCourse.
 * Без GETCOURSE_ACCOUNT и GETCOURSE_API_KEY работает заглушка с логом.
 *
 * TODO(content): GetCourse идентифицирует пользователя по email, а форма собирает только
 * имя и WhatsApp. Нужно подтвердить у заказчика: в аккаунте включён вход по телефону
 * или в форму добавляем email.
 */

export interface SyncResult {
  ok: boolean;
  stub: boolean;
  detail?: string;
}

export function getcourseConfigured(): boolean {
  return Boolean(process.env.GETCOURSE_ACCOUNT && process.env.GETCOURSE_API_KEY);
}

export async function syncLead(lead: Lead, archetypeNames: { primary: string; secondary: string }): Promise<SyncResult> {
  const addfields = {
    "Архетип": archetypeNames.primary,
    "Второй архетип": archetypeNames.secondary,
    "Работа": lead.job,
    "Цель": lead.goal,
    "Сегмент": lead.segment,
    lead_id: lead.publicId,
    utm_source: lead.utmSource ?? "",
    utm_medium: lead.utmMedium ?? "",
    utm_campaign: lead.utmCampaign ?? "",
    utm_content: lead.utmContent ?? "",
    utm_term: lead.utmTerm ?? "",
  };

  if (!getcourseConfigured()) {
    console.log(`[getcourse:stub] пользователь ${lead.whatsapp}`, addfields);
    return { ok: true, stub: true, detail: "Заглушка: GETCOURSE_ACCOUNT и GETCOURSE_API_KEY не заданы" };
  }

  const params = {
    user: { phone: lead.whatsapp, first_name: lead.name, addfields },
    system: { refresh_if_exists: 1 },
  };
  const body = new URLSearchParams({
    action: "add",
    key: process.env.GETCOURSE_API_KEY!,
    params: Buffer.from(JSON.stringify(params), "utf8").toString("base64"),
  });

  try {
    const response = await fetch(`https://${process.env.GETCOURSE_ACCOUNT}.getcourse.ru/pl/api/users`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const json = (await response.json().catch(() => null)) as
      | { success?: boolean; result?: { success?: boolean; error_message?: string } }
      | null;
    const ok = Boolean(response.ok && json?.success && json.result?.success !== false);
    return { ok, stub: false, detail: ok ? undefined : json?.result?.error_message || `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, stub: false, detail: String(error) };
  }
}

/** Ссылка на оплату или null, если ссылка продукта ещё не задана в переменных окружения */
export function paymentUrl(product: Product, lead: Lead | null): string | null {
  const base = process.env[funnel.products[product].offerEnv];
  if (!base) return null;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  if (lead) {
    url.searchParams.set("lead_id", lead.publicId);
    const utm: Record<string, string | null> = {
      utm_source: lead.utmSource,
      utm_medium: lead.utmMedium,
      utm_campaign: lead.utmCampaign,
      utm_content: lead.utmContent,
      utm_term: lead.utmTerm,
    };
    for (const [key, value] of Object.entries(utm)) if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}
