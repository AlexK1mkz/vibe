import type { Metadata } from "next";
import { cookies } from "next/headers";
import { formatPrice, funnel } from "@/config/funnel";
import { TrackedLink } from "@/components/client-bits";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";
import { LEAD_COOKIE } from "@/lib/server-utils";

const t = getDictionary();
const s = t.intensive;

export const metadata: Metadata = { title: s.metaTitle, description: fmt(s.lead) };

export default async function IntensivePage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const leadId = (await searchParams).lead || (await cookies()).get(LEAD_COOKIE)?.value;
  const leadParam = leadId ? `&lead=${encodeURIComponent(leadId)}` : "";
  const tariffs = (["intensive", "vip"] as const).map((key) => ({
    key,
    ...s.tariffs[key],
    price: funnel.products[key].price,
  }));

  return (
    <>
      <SiteHeader cta={false} />
      <main id="content" className="container-page py-10 sm:py-16">
        <p className="eyebrow">{fmt(s.eyebrow)}</p>
        <h1 className="mt-3 max-w-3xl text-[34px] font-extrabold leading-[1.08] sm:text-5xl">{fmt(s.title)}</h1>
        <p className="mt-5 text-lg text-muted">{fmt(s.lead)}</p>

        <h2 className="mt-12 text-2xl font-bold">{s.programTitle}</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {s.eveningTopics.map((topic, i) => (
            <li key={i} className="rounded-[20px] border border-line bg-white p-5">
              <p className="eyebrow">{fmt(s.evening, { n: i + 1 })}</p>
              {topic ? (
                <p className="mt-2 text-lg font-bold leading-snug">{topic}</p>
              ) : (
                <p className="mt-2 text-sm text-muted">{s.eveningPending}</p>
              )}
            </li>
          ))}
        </ol>

        <h2 className="mt-12 text-2xl font-bold">{s.tariffsTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tariffs.map((tariff) => (
            <div
              key={tariff.key}
              className={`rounded-[24px] p-7 ${tariff.key === "vip" ? "on-dark bg-deep text-white" : "border border-line bg-white"}`}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.14em] ${tariff.key === "vip" ? "text-lime" : "text-muted"}`}>
                {tariff.name}
              </p>
              <p className="mt-2 text-4xl font-extrabold">{formatPrice(tariff.price)}</p>
              {tariff.includes.length > 0 ? (
                <ul className="mt-4 grid gap-2">
                  {tariff.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-4 text-sm ${tariff.key === "vip" ? "text-white/75" : "text-muted"}`}>{s.includesPending}</p>
              )}
              <TrackedLink
                href={`/api/pay?product=${tariff.key}${leadParam}`}
                event="cta_intensive_click"
                payload={{ from: "intensive", tariff: tariff.key, value: tariff.price, currency: "KZT" }}
                leadId={leadId}
                className={`btn mt-6 w-full ${tariff.key === "vip" ? "btn-lime" : "btn-primary"}`}
              >
                {fmt(tariff.cta)}
              </TrackedLink>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted">
          {s.after}{" "}
          <a href={funnel.contacts.whatsappHref} className="font-bold text-ink underline" rel="noopener">
            {t.common.whatsapp}
          </a>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
