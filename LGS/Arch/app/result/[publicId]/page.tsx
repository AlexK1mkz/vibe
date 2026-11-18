import type { Metadata } from "next";
import Link from "next/link";
import { funnel } from "@/config/funnel";
import { ShareButton, TrackedLink, TrackOnMount } from "@/components/client-bits";
import { ContactForm } from "@/components/contact-form";
import { RadarChart } from "@/components/radar-chart";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";
import { results, test, type ArchetypeCode, type Cost, type Goal, type Job } from "@/lib/content";
import type { Lead } from "@/lib/db/schema";
import { getLead } from "@/lib/leads";

export const dynamic = "force-dynamic";

const t = getDictionary();
const r = t.result;

type Params = { params: Promise<{ publicId: string }> };

function headline(lead: Lead) {
  const primary = results.archetypes[lead.primary as ArchetypeCode].name;
  const secondary = results.archetypes[lead.secondary as ArchetypeCode].name;
  return lead.isPair
    ? { title: fmt(r.pair, { primary, secondary }), sub: null as string | null }
    : { title: fmt(r.single, { primary }), sub: fmt(r.secondary, { secondary }) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { publicId } = await params;
  const lead = await getLead(publicId).catch(() => null);
  const title = lead ? headline(lead).title : r.notFoundTitle;
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { title, description: t.meta.ogSubtitle },
  };
}

function Draft({ status }: { status: string }) {
  // Черновики показываются и в продакшне; пометка видна только при разработке
  if (status === "approved" || process.env.NODE_ENV === "production") return null;
  return <span className="draft-mark ml-2 align-middle">{t.common.draft}</span>;
}

function Section({ title, children, note }: { title: React.ReactNode; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="text-[22px] font-bold leading-tight">{title}</h2>
      {note && <p className="eyebrow mt-2">{note}</p>}
      <div className="mt-4 text-[17px] leading-relaxed">{children}</div>
    </section>
  );
}

function NextStep({ lead }: { lead: Lead }) {
  const segment = lead.segment as keyof typeof r.cta;
  const consult = `/consultation?lead=${lead.publicId}`;
  const intensive = `/intensive?lead=${lead.publicId}`;
  const cta = r.cta[segment] ?? r.cta.B;
  const primary =
    segment === "A"
      ? { href: consult, event: "cta_consult_click" }
      : { href: intensive, event: "cta_intensive_click" };
  const secondary =
    segment === "A"
      ? { href: intensive, event: "cta_intensive_click" }
      : segment === "specialist"
        ? { href: "/specialists", event: "cta_specialists_click" }
        : null;

  return (
    <section className="on-dark -mx-5 mt-2 bg-deep px-5 py-10 text-white sm:mx-0 sm:rounded-[24px] sm:px-10" data-segment={segment}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime">{r.nextStep}</p>
      <p className="mt-3 text-[22px] font-bold leading-snug">{fmt(cta.lead)}</p>
      <div className="mt-6 grid gap-3">
        <TrackedLink
          href={primary.href}
          event={primary.event}
          payload={{ segment, from: "result" }}
          leadId={lead.publicId}
          className="btn btn-lime w-full"
        >
          {fmt(cta.primary)}
        </TrackedLink>
        {secondary && "secondary" in cta && (
          <TrackedLink
            href={secondary.href}
            event={secondary.event}
            payload={{ segment, from: "result" }}
            leadId={lead.publicId}
            className="btn w-full border-[1.5px] border-white/40 text-white hover:border-white"
          >
            {fmt(cta.secondary)}
          </TrackedLink>
        )}
      </div>
    </section>
  );
}

export default async function ResultPage({ params }: Params) {
  const { publicId } = await params;
  const lead = await getLead(publicId);

  if (!lead) {
    return (
      <>
        <SiteHeader />
        <main id="content" className="container-narrow py-20 text-center">
          <h1 className="text-3xl font-bold">{r.notFoundTitle}</h1>
          <p className="mt-3 text-muted">{r.notFoundText}</p>
          <Link href="/test" className="btn btn-primary mt-8">
            {t.common.takeTest}
          </Link>
        </main>
      </>
    );
  }

  const primaryCode = lead.primary as ArchetypeCode;
  const secondaryCode = lead.secondary as ArchetypeCode;
  const a = results.archetypes[primaryCode];
  const names = Object.fromEntries(test.archetypes.map((c) => [c, results.archetypes[c].name])) as Record<ArchetypeCode, string>;
  const profile = Object.fromEntries(
    test.archetypes.map((c) => [c, Math.round(((lead.scores[c] ?? 0) / funnel.test.maxScore) * 100)]),
  ) as Record<ArchetypeCode, number>;
  const summary = fmt(r.chartSummary, {
    list: test.archetypes.map((c) => `${names[c]} ${profile[c]}%`).join(", "),
  });
  const { title, sub } = headline(lead);
  const full = lead.status !== "test_done";
  const blind = a.blindZone[lead.job as Job];
  const cost = results.cost[lead.cost as Cost];
  const possible = a.possible[lead.goal as Goal];

  return (
    <>
      <SiteHeader cta={false} />
      <main id="content" className="container-narrow pb-16">
        {/* Первый экран: архетип и диаграмма помещаются целиком, удобно для скриншота */}
        <section className="pt-6 text-center" data-testid="short-result">
          <p className="eyebrow">{r.eyebrow}</p>
          <h1 className="mt-2 text-[28px] font-extrabold leading-[1.1] sm:text-4xl" data-testid="archetype-title">
            {title}
          </h1>
          {sub && <p className="mt-1 text-lg font-semibold text-muted">{sub}</p>}
          <p className="mx-auto mt-3 max-w-md text-[17px] leading-snug">{a.core.tagline}</p>
          <RadarChart
            className="mt-2"
            profile={profile}
            names={names}
            order={test.archetypes}
            highlight={lead.isPair ? [primaryCode, secondaryCode] : [primaryCode]}
            title={r.chartTitle}
            summary={summary}
          />
        </section>

        <div className="card mt-2 border-lime bg-lime/40">
          <p className="eyebrow !text-deep">
            {r.strength}
            <Draft status={a.core.status} />
          </p>
          <p className="mt-2 text-[17px] font-semibold leading-snug">{a.core.strength}</p>
        </div>

        {lead.isPair && <p className="mt-4 text-sm text-muted">{results.pairNote.text}</p>}

        {!full ? (
          <>
            <TrackOnMount name="test_complete" leadId={lead.publicId} onceKey={`complete_${lead.publicId}`} payload={{ archetype: lead.primary, segment: lead.segment }} />
            <div className="mt-6">
              <ContactForm publicId={lead.publicId} strings={t.contactForm} />
            </div>
            <div className="mt-6 px-1">
              <p className="eyebrow">{r.locked.title}</p>
              <ul className="mt-3 grid gap-2 text-[17px]">
                {r.locked.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="text-green">
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div data-testid="full-result" className="mt-8">
            <TrackOnMount name="result_view" leadId={lead.publicId} onceKey={`result_${lead.publicId}`} payload={{ archetype: lead.primary, segment: lead.segment }} />

            <Section title={<>{r.how}<Draft status={a.core.status} /></>}>
              <p>{a.core.how}</p>
            </Section>

            <Section title={r.works}>
              <ul className="grid gap-3">
                {a.core.works.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              title={<>{r.blindZone}<Draft status={blind.status} /></>}
              note={fmt(r.situation, { job: t.jobs[lead.job] ?? lead.job })}
            >
              <p>{blind.text}</p>
            </Section>

            <Section title={<>{r.cost}<Draft status={cost.status} /></>}>
              <p>{cost.text}</p>
            </Section>

            <Section title={<>{r.possible}<Draft status={possible.status} /></>}>
              <ul className="grid gap-3">
                {possible.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="font-bold text-green">
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              {lead.goalText && (
                <p className="mt-5 rounded-xl bg-white px-4 py-3 text-base text-muted">
                  {r.yourWords} <span className="text-ink">«{lead.goalText}»</span>
                </p>
              )}
            </Section>

            <Section title={<>{r.technique}<Draft status={a.technique.status} /></>} note={r.techniqueNote}>
              <p className="font-bold">{a.technique.title}</p>
              <ol className="mt-4 grid gap-4">
                {a.technique.steps.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <NextStep lead={lead} />

            <div className="mt-8 flex flex-col items-start gap-4">
              <ShareButton label={r.share} text={r.shareText} copied={r.copied} />
              <p className="text-sm text-muted">{results.disclaimer.text}</p>
            </div>
          </div>
        )}

        {!full && <p className="mt-8 text-sm text-muted">{results.disclaimer.text}</p>}
      </main>
      <SiteFooter />
    </>
  );
}
