import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import landing from "@/content/landing.json";
import { plain, Portrait, Rich, SiteFooter, SiteHeader, StickyCta } from "@/components/site-chrome";
import { fmt } from "@/dictionaries";

const l = landing;

export const metadata: Metadata = {
  title: { absolute: l.meta.title },
  description: l.meta.description,
  openGraph: { title: l.meta.ogTitle, description: l.meta.description },
};

function Head({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="eyebrow-accent">{fmt(eyebrow)}</p>
      <h2 className="h-section mt-4">
        <Rich text={fmt(title)} />
      </h2>
    </>
  );
}

function Cta({ note = false }: { note?: boolean }) {
  return (
    <div>
      <Link href="/test" className="btn btn-primary w-full !text-[17px] sm:w-auto sm:min-w-72">
        {l.hero.cta}
        <span aria-hidden="true">→</span>
      </Link>
      {note && <p className="mt-3 text-sm text-muted">{l.hero.note}</p>}
    </div>
  );
}

/** Клиентский лендинг курса «НЛП Практик». Вход в воронку: бесплатный тест. */
export default function LandingPage() {
  const sources = l.sources.cards.filter((card) => card.published);
  const stories = l.stories.enabled ? (l.stories.items as { name: string; photo?: string; before: string; after: string }[]) : [];

  return (
    <>
      <SiteHeader variant="client" />
      <main id="content">
        {/* 1. Первый экран: понятное обещание, цифры программы, лицо */}
        <section className="relative overflow-hidden">
          <div className="container-page relative grid lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-10">
            <div className="pointer-events-none absolute -right-6 top-0 h-[260px] w-[74%] sm:w-[52%] lg:static lg:order-2 lg:h-auto lg:w-full">
              <Image
                src={l.hero.portrait.src}
                alt={l.hero.portrait.alt}
                width={640}
                height={640}
                priority
                sizes="(max-width: 1024px) 78vw, 480px"
                className="hero-portrait h-full w-full object-cover object-top lg:aspect-[4/5] lg:h-auto"
              />
            </div>
            <div className="relative pb-14 pt-28 sm:pb-20 sm:pt-52 lg:order-1 lg:pt-24">
              <p className="eyebrow-accent max-w-[26ch]">{fmt(l.hero.eyebrow)}</p>
              <h1 className="display mt-3 text-[50px] sm:text-[104px] lg:text-[120px]">
                <Rich text={l.hero.title} />
              </h1>
              <p className="mt-4 max-w-xl text-base leading-snug text-ink/85 sm:text-xl">{l.hero.subtitle}</p>
              <dl className="mt-5 grid max-w-xl grid-cols-3 gap-3">
                {l.hero.stats.map((stat) => (
                  <div key={stat.label} className="border-t border-line pt-3">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="stat-value">{stat.value}</dd>
                    <dd className="mt-1 text-[13px] leading-tight text-muted sm:text-base">{stat.label}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8">
                <Cta note />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Для кого */}
        <section className="section light">
          <div className="container-page">
            <Head eyebrow={l.forWhom.eyebrow} title={l.forWhom.title} />
            <ul className="mt-10 flex flex-wrap gap-3">
              {l.forWhom.pills.map((pill) => (
                <li key={pill} className="pill">
                  «{pill}»
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">{l.forWhom.after}</p>
          </div>
        </section>

        {/* 3. Главный результат */}
        <section className="section bg-surface">
          <div className="container-page">
            <Head eyebrow={l.result.eyebrow} title={l.result.title} />
            <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {l.result.items.map((item, i) => (
                <li key={item.title} className="rounded-[20px] border border-line bg-bg p-6">
                  <span className="num">0{i + 1}</span>
                  <h3 className="mt-4 text-xl font-bold leading-snug">{item.title}</h3>
                  <p className="mt-2 text-muted">{item.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-2xl border-l-2 border-accent pl-4 text-muted">{l.result.after}</p>
            <div className="mt-10">
              <Cta />
            </div>
          </div>
        </section>

        {/* 4. Чем отличается курс: три уровня сопровождения */}
        <section className="section">
          <div className="container-page">
            <Head eyebrow={l.practice.eyebrow} title={l.practice.title} />
            <p className="mt-6 max-w-2xl text-lg text-muted">{l.practice.text}</p>
            <ul className="mt-10 grid gap-3 lg:grid-cols-3">
              {l.practice.levels.map((level) => (
                <li key={level.role} className="card !p-7">
                  <p className="display text-[34px] text-accent">{level.role}</p>
                  <h3 className="mt-4 text-xl font-bold">{level.title}</h3>
                  <p className="mt-2 text-muted">{level.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Программа */}
        <section className="section light">
          <div className="container-page">
            <Head eyebrow={l.program.eyebrow} title={l.program.title} />
            <ol className="mt-10 border-b border-line">
              {l.program.modules.map((module, i) => (
                <li key={module.title} className="grid gap-2 border-t border-line py-6 sm:grid-cols-[72px_280px_1fr] sm:gap-6">
                  <span className="num">0{i + 1}</span>
                  <h3 className="text-xl font-bold leading-snug">{module.title}</h3>
                  <p className="text-muted">{module.text}</p>
                </li>
              ))}
            </ol>
            <ul className="mt-8 flex flex-wrap gap-2">
              {l.program.format.map((item) => (
                <li key={item} className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
                  {fmt(item)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Первый шаг: тест */}
        <section className="section">
          <div className="container-page">
            <Head eyebrow={l.test.eyebrow} title={l.test.title} />
            <p className="mt-6 max-w-2xl text-lg text-muted">{l.test.text}</p>
            <ol className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {l.test.items.map((item, i) => (
                <li key={item.title} className="border-t border-line pt-5">
                  <span className="num">0{i + 1}</span>
                  <h3 className="mt-3 text-2xl font-bold leading-snug">{item.title}</h3>
                  <p className="mt-2 text-muted">{item.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <Cta note />
            </div>
          </div>
        </section>

        {/* 7. На что опирается: карточка выводится только с подтверждённым источником */}
        {sources.length > 0 && (
          <section className="section">
            <div className="container-page">
              <Head eyebrow={l.sources.eyebrow} title={l.sources.title} />
              <ul className="mt-10 grid gap-3 lg:grid-cols-3">
                {sources.map((card, i) => (
                  <li key={card.title} className="card !p-7">
                    <span className="num">0{i + 1}</span>
                    <h3 className="mt-3 text-xl font-bold">{card.title}</h3>
                    <p className="mt-2 text-muted">{card.text}</p>
                    {card.source && <p className="mt-4 border-t border-line pt-4 text-sm text-muted">{card.source}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 8. Кто стоит за институтом: лица и только подтверждённые факты */}
        <section className="section bg-surface">
          <div className="container-page">
            <Head eyebrow={l.author.eyebrow} title={l.author.title} />
            <ul className="mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:gap-6">
              {l.author.people.map((person) => (
                <li key={person.name}>
                  <Portrait src={person.photo} alt={person.photoAlt} className="aspect-[4/5] w-full rounded-[20px] object-top" />
                  <h3 className="display mt-4 text-[26px] sm:text-[44px]">{person.name}</h3>
                  <p className="mt-2 text-sm text-muted sm:text-lg">{person.role}</p>
                  {(person.facts as string[]).length > 0 && (
                    <ul className="mt-4 grid gap-2 text-sm sm:text-base">
                      {(person.facts as string[]).map((fact) => (
                        <li key={fact} className="flex gap-2">
                          <span aria-hidden="true" className="text-accent">
                            →
                          </span>
                          {fact}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-xl border-t border-line pt-5 text-muted">{l.author.team}</p>
          </div>
        </section>

        {/* 9. Истории учеников: только реальные и с письменным разрешением */}
        {stories.length > 0 && (
          <section className="section">
            <div className="container-page">
              <Head eyebrow={l.stories.eyebrow} title={l.stories.title} />
              <ul className="mt-10 grid gap-3 lg:grid-cols-3">
                {stories.map((story) => (
                  <li key={story.name} className="card !p-7">
                    <div className="flex items-center gap-4">
                      <Portrait src={story.photo} alt={story.name} className="h-16 w-16 rounded-full" />
                      <p className="text-lg font-bold">{story.name}</p>
                    </div>
                    <p className="mt-5 text-muted">{story.before}</p>
                    <p className="mt-3">{story.after}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 10. Как начать */}
        <section className="section light">
          <div className="container-page">
            <Head eyebrow={l.path.eyebrow} title={l.path.title} />
            <ol className="mt-10 grid gap-3 lg:grid-cols-4">
              {l.path.steps.map((step) => (
                <li key={step.title} className="card flex flex-col !p-6">
                  <p className="display text-[34px] text-accent">{step.label}</p>
                  <h3 className="mt-4 text-xl font-bold leading-snug">{fmt(step.title)}</h3>
                  <p className="mt-2 text-muted">{fmt(step.text)}</p>
                  <p className="mt-auto pt-5 font-bold">
                    <span className="block border-t border-line pt-4">{fmt(step.price)}</span>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 11. Вопросы */}
        <section className="section bg-surface">
          <div className="container-page">
            <Head eyebrow={l.faq.eyebrow} title={l.faq.title} />
            <div className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
              {l.faq.items.map((item) => (
                <details key={item.id} className="group py-1">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-bold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="text-2xl font-normal text-accent transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-6 pr-8 text-muted">{fmt(item.a)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 12. Финальный призыв */}
        <section className="section">
          <div className="container-page">
            <h2 className="display text-[56px] sm:text-[120px]">
              <Rich text={l.final.title} />
            </h2>
            <p className="mt-5 max-w-xl text-lg text-muted">{l.final.text}</p>
            <div className="mt-8">
              <Cta note />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter padForStickyCta />
      <StickyCta href="/test" label={plain(l.hero.cta)} />
    </>
  );
}
