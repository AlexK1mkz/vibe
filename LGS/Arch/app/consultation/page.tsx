import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { formatPrice, funnel } from "@/config/funnel";
import { TrackedLink } from "@/components/client-bits";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";
import { LEAD_COOKIE } from "@/lib/server-utils";

const t = getDictionary();
const c = t.consultation;

export const metadata: Metadata = { title: c.metaTitle, description: fmt(c.lead) };

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const leadId = (await searchParams).lead || (await cookies()).get(LEAD_COOKIE)?.value;
  const payHref = `/api/pay?product=consult${leadId ? `&lead=${encodeURIComponent(leadId)}` : ""}`;

  return (
    <>
      <SiteHeader cta={false} />
      <main id="content" className="container-narrow py-10 sm:py-16">
        <p className="eyebrow">{c.eyebrow}</p>
        <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] sm:text-5xl">{fmt(c.title)}</h1>
        <p className="mt-5 text-lg text-muted">{fmt(c.lead)}</p>

        <h2 className="mt-12 text-2xl font-bold">{c.whatTitle}</h2>
        <ol className="mt-6 grid gap-6">
          {c.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-on-accent">
                {i + 1}
              </span>
              <div>
                <h3 className="text-xl font-bold leading-snug">{step.title}</h3>
                <p className="mt-1 text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="card mt-12">
          <p className="eyebrow">{c.priceLabel}</p>
          <p className="mt-2 text-4xl font-extrabold">{formatPrice(funnel.products.consult.price)}</p>
          <TrackedLink
            href={payHref}
            event="cta_consult_click"
            payload={{ from: "consultation", value: funnel.products.consult.price, currency: "KZT" }}
            leadId={leadId}
            className="btn btn-primary mt-5 w-full"
          >
            {fmt(c.cta)}
          </TrackedLink>
          <p className="mt-3 text-sm text-muted">{c.after}</p>
        </div>

        {!leadId && (
          <p className="mt-8 text-muted">
            {c.noTest}{" "}
            <Link href="/test" className="font-bold text-ink underline">
              {t.common.takeTest}
            </Link>
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
