import type { Metadata } from "next";
import { TrackOnMount } from "@/components/client-bits";
import { Portrait, SiteFooter, SiteHeader, StickyCta } from "@/components/site-chrome";
import { SpecialistForm } from "@/components/specialist-form";
import { getDictionary } from "@/dictionaries";
import { specialists as s } from "@/lib/specialists-content";

/** Лендинг для специалистов (ТЗ v2, раздел 8): 12 блоков, все тексты в content/specialists.json */

export const metadata: Metadata = {
  title: s.meta.title,
  description: s.meta.description,
  openGraph: { title: s.meta.title, description: s.meta.description },
};

const num = (i: number) => String(i + 1).padStart(2, "0");

function SectionHead({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="h-section mt-4">
        {title}
      </h2>
    </>
  );
}

export default function SpecialistsPage() {
  const shared = getDictionary().contactForm;
  const conditions = s.conditions.rows.filter((row) => row.published && row.terms);
  const stories = s.stories.enabled ? s.stories.items : [];

  return (
    <>
      <TrackOnMount name="specialist_view" payload={{ audience: "specialist" }} onceKey="specialist_view" />
      <SiteHeader variant="specialists" />
      <main id="content" className="overflow-x-clip">
        {/* 1. Первый экран: целиком помещается на 360×740 вместе с закреплённой кнопкой */}
        <section className="container-page pb-14 pt-8 sm:pb-24 sm:pt-20" aria-labelledby="sp-hero">
          <p className="eyebrow-accent">{s.hero.eyebrow}</p>
          <h1 id="sp-hero" className="mt-3 max-w-[16ch] text-[32px] font-extrabold leading-[1.06] sm:mt-5 sm:text-6xl lg:text-7xl">
            {s.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted sm:mt-6 sm:text-xl">{s.hero.subtitle}</p>
          <a href="#form" className="btn btn-primary mt-6 w-full sm:mt-9 sm:w-auto sm:min-w-64">
            {s.common.cta}
            <span aria-hidden="true">↓</span>
          </a>
          <p className="mt-5 max-w-xl border-l-2 border-accent pl-4 text-sm sm:mt-8 sm:text-base">{s.hero.trainerNote}</p>
        </section>

        {/* 2. Проблема */}
        <section className="section" aria-labelledby="sp-problem">
          <div className="container-page">
            <SectionHead id="sp-problem" eyebrow={s.problem.eyebrow} title={s.problem.title} />
            <ul className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
              {s.problem.items.map((item, i) => (
                <li key={item.title} className="card">
                  <p className="num" aria-hidden="true">
                    {num(i)}
                  </p>
                  <h3 className="mt-4 text-xl font-bold leading-snug">{item.title}</h3>
                  <p className="mt-2 text-muted">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Путь роста: четыре ступени */}
        <section className="section bg-surface" aria-labelledby="sp-path">
          <div className="container-page">
            <SectionHead id="sp-path" eyebrow={s.path.eyebrow} title={s.path.title} />
            <ol className="mt-10 grid gap-3 sm:mt-14 lg:grid-cols-4 lg:gap-0">
              {s.path.steps.map((step, i) => {
                const fields = (["does", "gets", "next"] as const).filter((key) => step[key]);
                const last = i === s.path.steps.length - 1;
                return (
                  <li key={step.name} className="relative flex flex-col">
                    {/* Линия ступеней: на широком экране идёт слева направо */}
                    <div className="hidden items-center lg:flex" aria-hidden="true">
                      <span className="h-3 w-3 shrink-0 rounded-full bg-accent" />
                      <span className={`h-px flex-1 ${last ? "bg-transparent" : "bg-line"}`} />
                    </div>
                    <div className="flex-1 rounded-[20px] border border-line bg-bg p-6 lg:mr-4 lg:mt-5">
                      <p className="num" aria-hidden="true">
                        {num(i)}
                      </p>
                      <h3 className="mt-3 text-2xl font-extrabold leading-tight">{step.name}</h3>
                      {fields.length > 0 && (
                        <dl className="mt-5 grid gap-4">
                          {fields.map((key) => (
                            <div key={key}>
                              <dt className="eyebrow">{s.path.labels[key]}</dt>
                              <dd className="mt-1.5 text-[15px]">{step[key]}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {fields.length < 3 && (
                        <p className="mt-5 border-t border-line pt-4 text-sm text-muted">{s.path.pending}</p>
                      )}
                    </div>
                    {!last && (
                      <span className="mt-3 block text-center text-xl leading-none text-accent lg:hidden" aria-hidden="true">
                        ↓
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* 4. Три роли на первом потоке */}
        <section className="section" aria-labelledby="sp-roles">
          <div className="container-page">
            <SectionHead id="sp-roles" eyebrow={s.roles.eyebrow} title={s.roles.title} />
            <ul className="mt-10 grid gap-3 sm:mt-14 lg:grid-cols-3 lg:gap-4">
              {s.roles.items.map((role, i) => (
                <li key={role.id} className={`card flex flex-col ${role.badge ? "!border-accent" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="num" aria-hidden="true">
                      {num(i)}
                    </p>
                    {role.badge && (
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-on-accent">{role.badge}</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold">{role.name}</h3>
                  <dl className="mt-5 grid flex-1 content-between gap-5">
                    <div>
                      <dt className="eyebrow">{s.roles.labels.does}</dt>
                      <dd className="mt-1.5">{role.does}</dd>
                    </div>
                    <div className="border-t border-line pt-4">
                      <dt className="eyebrow">{s.roles.labels.load}</dt>
                      <dd className="mt-1.5 font-semibold">{role.load}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Что вы получаете */}
        <section className="section bg-surface" aria-labelledby="sp-benefits">
          <div className="container-page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <div>
              <SectionHead id="sp-benefits" eyebrow={s.benefits.eyebrow} title={s.benefits.title} />
            </div>
            <ol className="border-b border-line">
              {s.benefits.items.map((item, i) => (
                <li key={item} className="flex gap-5 border-t border-line py-5 sm:py-6">
                  <span className="num w-7 shrink-0 pt-1" aria-hidden="true">
                    {num(i)}
                  </span>
                  <span className="text-lg font-semibold leading-snug sm:text-xl">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. Условия честно: только строки с published = true */}
        <section className="section" aria-labelledby="sp-conditions">
          <div className="container-page">
            <SectionHead id="sp-conditions" eyebrow={s.conditions.eyebrow} title={s.conditions.title} />
            <p className="mt-6 max-w-2xl text-lg text-muted">{s.conditions.lead}</p>

            {/* Мобильный экран: карточки */}
            <dl className="mt-10 grid gap-3 sm:hidden">
              {conditions.map((row) => (
                <div key={row.what} className="card">
                  <dt className="text-sm text-muted">{row.what}</dt>
                  <dd className="mt-2 text-lg font-bold leading-snug">{row.terms}</dd>
                </div>
              ))}
            </dl>

            {/* От планшета: таблица */}
            <table className="mt-14 hidden w-full border-collapse text-left sm:table">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="eyebrow w-1/2 pb-4 pr-6">
                    {s.conditions.columns.what}
                  </th>
                  <th scope="col" className="eyebrow pb-4">
                    {s.conditions.columns.terms}
                  </th>
                </tr>
              </thead>
              <tbody>
                {conditions.map((row) => (
                  <tr key={row.what} className="border-b border-line align-top">
                    <th scope="row" className="py-5 pr-6 text-lg font-normal text-muted">
                      {row.what}
                    </th>
                    <td className="py-5 text-lg font-bold">{row.terms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Как устроен поток */}
        <section className="section bg-surface" aria-labelledby="sp-flow">
          <div className="container-page">
            <SectionHead id="sp-flow" eyebrow={s.flow.eyebrow} title={s.flow.title} />
            <dl className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:mt-14 lg:grid-cols-4">
              {s.flow.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse justify-end border-t border-line pt-5">
                  <dt className="mt-2 text-sm text-muted sm:text-base">{stat.label}</dt>
                  <dd className="text-[52px] font-extrabold leading-none tracking-tight tabular-nums sm:text-7xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 8. Отбор */}
        <section className="section" aria-labelledby="sp-selection">
          <div className="container-page">
            <SectionHead id="sp-selection" eyebrow={s.selection.eyebrow} title={s.selection.title} />
            <ol className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {s.selection.steps.map((step, i) => (
                <li key={step.title} className="card">
                  <p className="num" aria-hidden="true">
                    {num(i)}
                  </p>
                  <h3 className="mt-4 text-xl font-bold leading-snug">{step.title}</h3>
                  <p className="mt-2 text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 9. Кто руководит */}
        <section className="section bg-surface" aria-labelledby="sp-leaders">
          <div className="container-page">
            <SectionHead id="sp-leaders" eyebrow={s.leaders.eyebrow} title={s.leaders.title} />
            <ul className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:mt-14 sm:gap-8">
              {s.leaders.items.map((person) => (
                <li key={person.name}>
                  <Portrait src={person.photo} alt={person.photoAlt} className="aspect-[4/5] w-full rounded-[20px]" />
                  <h3 className="mt-4 text-xl font-extrabold leading-tight sm:text-2xl">{person.name}</h3>
                  {person.role && <p className="mt-1 text-sm text-muted sm:text-base">{person.role}</p>}
                  {person.facts.length > 0 && (
                    <ul className="mt-3 grid gap-1.5 text-sm text-muted">
                      {person.facts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 10. Истории специалистов: скрыты флагом stories.enabled, пока нет реальных историй с разрешением */}
        {stories.length > 0 && (
          <section className="section" aria-labelledby="sp-stories">
            <div className="container-page">
              <SectionHead id="sp-stories" eyebrow={s.stories.eyebrow} title={s.stories.title} />
              <ul className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {stories.map((story) => (
                  <li key={story.name} className="card">
                    <blockquote className="text-lg leading-snug">{story.text}</blockquote>
                    <p className="mt-5 font-bold">{story.name}</p>
                    <p className="text-sm text-muted">{story.role}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 11. Анкета */}
        <section className="section" aria-labelledby="sp-form-head">
          <div className="container-page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <div>
              <SectionHead id="sp-form-head" eyebrow={s.form.eyebrow} title={s.form.title} />
              <p className="mt-6 max-w-md text-lg text-muted">{s.form.lead}</p>
              <p className="mt-6 max-w-md border-l-2 border-accent pl-4 text-sm sm:text-base">{s.hero.trainerNote}</p>
            </div>
            <SpecialistForm strings={s.form} shared={shared} />
          </div>
        </section>

        {/* 12. Вопросы */}
        <section className="section bg-surface" aria-labelledby="sp-faq">
          <div className="container-page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <div>
              <SectionHead id="sp-faq" eyebrow={s.faq.eyebrow} title={s.faq.title} />
            </div>
            <div className="border-b border-line">
              {s.faq.items.map((item) => (
                <details key={item.q} className="group border-t border-line">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-lg font-bold leading-snug sm:text-xl [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-2xl font-normal leading-none text-accent transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-6 text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter padForStickyCta />
      <StickyCta href="#form" label={s.common.cta} />
    </>
  );
}
