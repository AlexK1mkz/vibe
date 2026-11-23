import type { Metadata } from "next";
import Link from "next/link";
import { funnel } from "@/config/funnel";
import { ShareButton, TrackedLink, TrackOnMount } from "@/components/client-bits";
import { ContactForm } from "@/components/contact-form";
import { ResultChart, type ChartGroup } from "@/components/result-chart";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";
import { isCeiling, isSphere, results, test, type CeilingCode, type Cost, type Goal, type Sphere } from "@/lib/content";
import type { Lead } from "@/lib/db/schema";
import { getLead } from "@/lib/leads";
import { specialistsHref } from "@/lib/site";

export const dynamic = "force-dynamic";

const t = getDictionary();
const r = t.result;

type Params = { params: Promise<{ publicId: string }> };

/** Результат теста версии 2. У записей версии 1 поля ceiling нет: для них результат не показываем */
interface Outcome {
  ceiling: CeilingCode;
  sphere: Sphere;
  free: boolean;
}

function outcomeOf(lead: Lead | null): Outcome | null {
  if (!lead || !isCeiling(lead.ceiling)) return null;
  const sphere = isSphere(lead.mainSphere) ? lead.mainSphere : isSphere(lead.sphere) ? lead.sphere : null;
  if (!sphere) return null;
  return { ceiling: lead.ceiling, sphere, free: lead.ceiling === "F" };
}

function headline(outcome: Outcome) {
  const ceiling = results.ceilings[outcome.ceiling].name;
  return fmt(outcome.free ? r.freeTitle : r.title, { ceiling });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { publicId } = await params;
  const outcome = outcomeOf(await getLead(publicId).catch(() => null));
  const title = outcome ? headline(outcome) : r.notFoundTitle;
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

function Bullets({ items, marker }: { items: string[]; marker: "dot" | "arrow" }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          {marker === "dot" ? (
            <span aria-hidden="true" className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-accent" />
          ) : (
            <span aria-hidden="true" className="font-bold text-accent">
              →
            </span>
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Блок 9: следующий шаг по сегменту (ТЗ v2, раздел 7) */
function NextStep({ lead }: { lead: Lead }) {
  const segment = (lead.segment in r.cta ? lead.segment : "B") as keyof typeof r.cta;
  const consult = { href: `/consultation?lead=${lead.publicId}`, event: "cta_consult_click" };
  const intensive = { href: `/intensive?lead=${lead.publicId}`, event: "cta_intensive_click" };
  const cta = r.cta[segment];
  const primary = segment === "A" ? consult : intensive;
  const secondary =
    segment === "A" ? intensive : segment === "pro" ? { href: specialistsHref(), event: "cta_specialists_click" } : null;

  return (
    <section className="card mt-2 border-accent" data-segment={segment}>
      <p className="eyebrow-accent">{r.nextStep}</p>
      <p className="mt-3 text-[22px] font-bold leading-snug">{r.yearFrame}</p>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">{fmt(cta.lead)}</p>
      <div className="mt-6 grid gap-3">
        <TrackedLink
          href={primary.href}
          event={primary.event}
          payload={{ segment, from: "result" }}
          leadId={lead.publicId}
          className="btn btn-primary w-full"
        >
          {fmt(cta.primary)}
        </TrackedLink>
        {secondary && "secondary" in cta && (
          <TrackedLink
            href={secondary.href}
            event={secondary.event}
            payload={{ segment, from: "result" }}
            leadId={lead.publicId}
            className="btn btn-ghost w-full"
          >
            {fmt(cta.secondary)}
          </TrackedLink>
        )}
      </div>
    </section>
  );
}

function chartGroups(lead: Lead, outcome: Outcome): { groups: ChartGroup[]; summary: string } {
  const typeMax = funnel.test.maxScore;
  const questionsIn = (sphere: Sphere) => test.questions.filter((q) => q.block === "B" && q.sphere === sphere).length;
  const sphereScores = lead.sphereScores ?? {};

  const beliefs = test.types.map((code) => ({
    key: code,
    label: results.ceilings[code].name,
    value: lead.scores[code] ?? 0,
    max: typeMax,
    // При «Свободном ходе» главного потолка нет: столбцы убеждений без акцента
    main: !outcome.free && code === outcome.ceiling,
  }));
  const spheres = test.spheres.map((sphere) => ({
    key: sphere,
    label: results.spheres[sphere].name,
    value: sphereScores[sphere] ?? 0,
    max: questionsIn(sphere),
    main: sphere === outcome.sphere && (sphereScores[sphere] ?? 0) > 0,
  }));
  const list = (rows: { label: string; value: number; max: number }[]) =>
    rows.map((row) => `${row.label}: ${fmt(r.chartValue, { n: row.value, max: row.max })}`).join("; ");

  return {
    groups: [
      { title: r.chartBeliefs, note: fmt(r.chartNote, { max: typeMax }), rows: beliefs },
      { title: r.chartSpheres, note: fmt(r.chartNote, { max: spheres[0]?.max ?? 0 }), rows: spheres },
    ],
    summary: fmt(r.chartSummary, {
      beliefs: list(beliefs),
      spheres: list(spheres),
      resource: lead.scores.R ?? 0,
      total: typeMax,
    }),
  };
}

export default async function ResultPage({ params }: Params) {
  const { publicId } = await params;
  const lead = await getLead(publicId);
  const outcome = outcomeOf(lead);

  if (!lead || !outcome) {
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

  const { free } = outcome;
  const c = results.ceilings[outcome.ceiling];
  const sphere = results.spheres[outcome.sphere];
  const inSphere = c.inSphere[outcome.sphere];
  const cost = results.cost[lead.cost as Cost] as (typeof results.cost)[Cost] | undefined;
  const possible = c.possible[lead.goal as Goal] as (typeof c.possible)[Goal] | undefined;
  const limiting = Object.values(lead.sphereScores ?? {}).reduce((sum, n) => sum + n, 0);
  const sphereLine = free
    ? limiting > 0
      ? fmt(r.freeSphereLine, { sphere: sphere.name })
      : r.freeNoLimits
    : fmt(r.sphereLine, { sphere: sphere.name });
  const chart = chartGroups(lead, outcome);
  const full = lead.status !== "test_done";
  const eventPayload = { ceiling: outcome.ceiling, sphere: outcome.sphere, segment: lead.segment };

  return (
    <>
      <SiteHeader cta={false} />
      <main id="content" className="container-narrow pb-16">
        {/* Блоки 1 и 2: название потолка, фраза убеждения, сфера и диаграмма */}
        <section className="pt-6" data-testid="short-result">
          <p className="eyebrow">{r.eyebrow}</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-[1.1] sm:text-4xl" data-testid="ceiling-title">
            {headline(outcome)}
          </h1>
          <p className="mt-3 text-lg font-semibold leading-snug" data-testid="ceiling-sphere">
            {sphereLine}
          </p>
          <div className="mt-5 border-l-2 border-accent pl-4">
            <p className="eyebrow">{r.voiceLabel}</p>
            <p className="mt-1 text-xl font-bold leading-snug text-accent">{c.voice}</p>
          </div>
          <p className="mt-5 text-[17px] leading-snug text-muted">{c.core.tagline}</p>
          <ResultChart
            className="card mt-6"
            title={r.chartTitle}
            groups={chart.groups}
            valueLabel={r.chartValue}
            mainLabel={r.chartMain}
            summary={chart.summary}
          />
        </section>

        {!full ? (
          <>
            <TrackOnMount name="test_complete" leadId={lead.publicId} onceKey={`complete_${lead.publicId}`} payload={eventPayload} />
            <div className="mt-6">
              <ContactForm publicId={lead.publicId} strings={t.contactForm} />
            </div>
            <div className="mt-6 px-1">
              <p className="eyebrow">{r.locked.title}</p>
              <ul className="mt-3 grid gap-2 text-[17px]">
                {r.locked.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="text-accent">
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-8 text-sm text-muted">{results.disclaimer.text}</p>
          </>
        ) : (
          <div data-testid="full-result" className="mt-8">
            <TrackOnMount name="result_view" leadId={lead.publicId} onceKey={`result_${lead.publicId}`} payload={eventPayload} />

            {/* Блок 3 */}
            <Section title={<>{free ? r.freeSounds : r.sounds}<Draft status={c.core.status} /></>}>
              <p>{c.core.sounds}</p>
            </Section>

            {/* Блок 4 */}
            <Section title={free ? r.freeHelped : r.helped}>
              <Bullets items={c.core.helped} marker="dot" />
            </Section>

            {/* Блок 5: тип × сфера */}
            <Section title={<>{fmt(free ? r.freeInSphere : r.inSphere, { in: sphere.in })}<Draft status={inSphere.status} /></>}>
              <p>{inSphere.text}</p>
            </Section>

            {/* Блок 6: ответ C1 */}
            {cost && (
              <Section title={<>{free ? r.freeCost : r.cost}<Draft status={cost.status} /></>}>
                <p>{cost.text}</p>
              </Section>
            )}

            {/* Блок 7: тип × цель из C2 */}
            {possible && (
              <Section title={<>{r.possible}<Draft status={possible.status} /></>}>
                <Bullets items={possible.items} marker="arrow" />
                {lead.goalText && (
                  <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-base text-muted">
                    {r.yourWords} <span className="text-ink">«{lead.goalText}»</span>
                  </p>
                )}
              </Section>
            )}

            {/* Блок 8 */}
            <Section title={<>{r.technique}<Draft status={c.technique.status} /></>} note={r.techniqueNote}>
              <p className="font-bold">{c.technique.title}</p>
              <ol className="mt-4 grid gap-4">
                {c.technique.steps.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Блок 9 */}
            <NextStep lead={lead} />

            {/* Блок 10: оговорка о самооценке */}
            <div className="mt-8 flex flex-col items-start gap-4">
              <ShareButton label={r.share} text={r.shareText} copied={r.copied} />
              <p className="text-sm text-muted">{results.disclaimer.text}</p>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
