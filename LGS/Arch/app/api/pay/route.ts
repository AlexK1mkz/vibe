import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { funnel, type Product } from "@/config/funnel";
import { fmt, getDictionary } from "@/dictionaries";
import { paymentUrl } from "@/integrations/getcourse";
import { ceilingName, isCeiling } from "@/lib/content";
import { getLead } from "@/lib/leads";
import { LEAD_COOKIE } from "@/lib/server-utils";

export const runtime = "nodejs";

const order = getDictionary().result.whatsappOrder;

/**
 * Перенаправляет на страницу заказа GetCourse с lead_id и UTM.
 * Пока ссылка продукта не задана в переменных окружения, открывает WhatsApp института
 * с готовым текстом заявки (ТЗ v2, раздел 7).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = url.searchParams.get("product") as Product;
  if (!(product in funnel.products)) return NextResponse.redirect(new URL("/", url));

  const publicId = url.searchParams.get("lead") || (await cookies()).get(LEAD_COOKIE)?.value || "";
  const lead = publicId ? await getLead(publicId).catch(() => null) : null;
  const target = paymentUrl(product, lead);
  if (!target) {
    const result = lead && isCeiling(lead.ceiling) ? ceilingName(lead.ceiling) : null;
    const text = result
      ? fmt(order.withResult, { result, product: order.products[product] })
      : fmt(order.noResult, { product: order.products[product] });
    return NextResponse.redirect(`${funnel.contacts.whatsappHref}?text=${encodeURIComponent(text)}`);
  }
  return NextResponse.redirect(target);
}
