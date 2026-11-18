import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { funnel, type Product } from "@/config/funnel";
import { TrackOnMount } from "@/components/client-bits";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";
import { getLead, purchaseEvents } from "@/lib/leads";
import { LEAD_COOKIE } from "@/lib/server-utils";

const t = getDictionary();
const th = t.thanks;

export const metadata: Metadata = { title: th.metaTitle, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ type?: string; lead?: string }> }) {
  const params = await searchParams;
  const type = params.type || "";
  const leadId = params.lead || (await cookies()).get(LEAD_COOKIE)?.value;
  const lead = leadId ? await getLead(leadId).catch(() => null) : null;

  const copy =
    type === "specialist"
      ? th.specialist
      : type === "pay_pending"
        ? th.payPending
        : type === "consult" || type === "intensive" || type === "vip"
          ? th[type]
          : th.generic;

  // Покупку в счётчики отправляем, только если оплату уже подтвердил вебхук GetCourse
  let purchase: { name: string; value: number } | null = null;
  if (lead && type in funnel.products) {
    const paid = await purchaseEvents(lead.id).catch(() => []);
    const event = paid.find((e) => e.name === `purchase_${type}`);
    if (event) {
      purchase = {
        name: event.name,
        value: Number((event.payload as { amount?: number } | null)?.amount ?? funnel.products[type as Product].price),
      };
    }
  }

  return (
    <>
      <SiteHeader cta={false} />
      <main id="content" className="container-narrow py-16 sm:py-24">
        {purchase && lead && (
          <TrackOnMount
            name={purchase.name}
            payload={{ value: purchase.value, currency: "KZT" }}
            onceKey={`${purchase.name}_${lead.publicId}`}
            countersOnly
          />
        )}
        <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-lime text-2xl font-bold text-deep">
          ✓
        </div>
        <h1 className="mt-6 text-[34px] font-extrabold leading-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-lg text-muted">{fmt(copy.text)}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {type === "pay_pending" && (
            <a href={funnel.contacts.whatsappHref} className="btn btn-primary" rel="noopener">
              {t.common.whatsapp}
            </a>
          )}
          {lead && (
            <Link href={`/result/${lead.publicId}`} className="btn btn-ghost">
              {th.toResult}
            </Link>
          )}
          <Link href="/" className="btn btn-ghost">
            {t.common.home}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
