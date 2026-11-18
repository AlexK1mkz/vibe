import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { funnel, type Product } from "@/config/funnel";
import { paymentUrl } from "@/integrations/getcourse";
import { getLead } from "@/lib/leads";
import { LEAD_COOKIE } from "@/lib/server-utils";

export const runtime = "nodejs";

/** Перенаправляет на страницу заказа GetCourse с lead_id и UTM */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = url.searchParams.get("product") as Product;
  if (!(product in funnel.products)) return NextResponse.redirect(new URL("/", url));

  const publicId = url.searchParams.get("lead") || (await cookies()).get(LEAD_COOKIE)?.value || "";
  const lead = publicId ? await getLead(publicId).catch(() => null) : null;
  const target = paymentUrl(product, lead);
  if (!target) {
    // Ссылка на оплату ещё не задана: честно говорим об этом и даём связь с институтом
    return NextResponse.redirect(new URL(`/thanks?type=pay_pending&product=${product}`, url));
  }
  return NextResponse.redirect(target);
}
