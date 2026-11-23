import landing from "@/content/landing.json";
import { Portrait, SiteFooter, SiteHeader, StickyCta, TestCta } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";

const t = getDictionary();
const l = landing;

function Head({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="eyebrow-accent">{fmt(eyebrow)}</p>
      <h2 className="h-section mt-4">{fmt(title)}</h2>
    </>
  );
}

/** Клиентский лендинг: 12 блоков раздела 5 ТЗ v2 */
export default function LandingPage() {
  const sources = l.sources.cards.filter((card) => card.published);
  const stories = l.stories.enabled ? (l.stories.items as { name: string; photo?: string; before: string; after: string }[]) : [];
  const facts = l.author.facts as string[];

  return (
    <>
      <SiteHeader variant="client" />
      <main id="content">
        {/* 1. Первый экран */}
        <section className="container-page grid gap-10 pb-16 pt-10 sm:pb-24 sm:pt-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="eyebrow-accent">{l.hero.eyebrow}</p>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.02] sm:text-[72px]">{l.hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-snug text-muted sm:text-xl">{l.hero.subtitle}</p>
            <div className="mt-8">
              <TestCta />
            </div>
          </div>
          <figure className="flex items-center gap-4 lg:flex-col lg:items-start">
            <Portrait
              src={l.hero.portrait.src}
              alt={l.hero.portrait.alt}
              className="h-24 w-24 rounded-[22px] grayscale lg:h-auto lg:w-full lg:max-w-[340px] lg:rounded-[28px]"
            />
            <figcaption className="text-sm text-muted">{l.hero.portrait.caption}</figcaption>
          </figure>
        </section>

        {/* 2. Узнавание */}
        <section className="section">
          <div className="container-page">
            <Head eyebrow={l.recognition.eyebrow} title={l.recognition.title} />
            <ul className="mt-10 grid gap-3 lg:grid-cols-3">
              {l.recognition.cards.map((card, i) => (
                <li key={card.sphere} className="card flex flex-col gap-6 !p-7">
                  <p className="flex items-baseline justify-between">
                    <span className="num">0{i + 1}</span>
                    <span className="eyebrow">{card.sphere}</span>
                  </p>
                  <p className="text-2xl font-bold leading-snug">«{card.quote}»</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-xl text-lg text-muted">{l.recognition.after}</p>
            <div className="mt-8">
              <TestCta />
            </div>
          </div>
        </section>

        {/* 3. Что вы получите */}
        <section className="section">
          <div className="container-page">
            <Head eyebrow={l.get.eyebrow} title={l.get.title} />
            <ol className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {l.get.items.map((item, i) => (
                <li key={item.title} className="border-t border-line pt-5">
                  <span className="num">0{i + 1}</span>
                  <h3 className="mt-3 text-2xl font-bold leading-snug">{item.title}</h3>
                  <p className="mt-2 text-muted">{item.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-2xl border-l-2 border-accent pl-4 text-muted">{l.get.after}</p>
          </div>
        </section>

        {/* 4. Почему это навык */}
        <section className="section bg-surface">
          <div className="container-page">
            <Head eyebrow={l.skill.eyebrow} title={l.skill.title} />
            <p className="mt-6 max-w-2xl text-lg text-muted">{l.skill.text}</p>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              {l.skill.points.map((point) => (
                <li key={point.title} className="border-t border-line pt-5">
                  <h3 className="text-2xl font-bold text-accent">{point.title}</h3>
                  <p className="mt-2 text-muted">{fmt(point.text)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-12 max-w-3xl text-[28px] font-extrabold leading-tight sm:text-[40px]">{l.skill.frame}</p>
            <div className="mt-8">
              <TestCta />
            </div>
          </div>
        </section>

        {/* 5. На что опирается: карточка выводится только с подтверждённым источником */}
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

        {/* 6. Автор: только подтверждённые факты */}
        <section className="section">
          <div className="container-page grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-14">
            <Portrait src={l.author.photo} alt={l.author.photoAlt} className="h-52 w-52 rounded-[28px] grayscale sm:h-72 sm:w-72" />
            <div>
              <p className="eyebrow-accent">{l.author.eyebrow}</p>
              <h2 className="h-section mt-4">{l.author.name}</h2>
              <p className="mt-3 text-lg text-muted">{l.author.role}</p>
              {facts.length > 0 && (
                <ul className="mt-6 grid gap-2">
                  {facts.map((fact) => (
                    <li key={fact} className="flex gap-3">
                      <span aria-hidden="true" className="text-accent">
                        →
                      </span>
                      {fact}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-6 max-w-xl border-t border-line pt-5 text-muted">{l.author.team}</p>
            </div>
          </div>
        </section>

        {/* 7. Истории учеников: только реальные и с письменным разрешением */}
        {stories.length > 0 && (
          <section className="section">
            <div className="container-page">
              <Head eyebrow={l.stories.eyebrow} title={l.stories.title} />
              <ul className="mt-10 grid gap-3 lg:grid-cols-3">
                {stories.map((story) => (
                  <li key={story.name} className="card !p-7">
                    <div className="flex items-center gap-4">
                      <Portrait src={story.photo} alt={story.name} className="h-16 w-16 rounded-full grayscale" />
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

        {/* 8. Путь */}
        <section className="section bg-surface">
          <div className="container-page">
            <Head eyebrow={l.path.eyebrow} title={l.path.title} />
            <ol className="mt-10 grid gap-3 lg:grid-cols-4">
              {l.path.steps.map((step) => (
                <li key={step.title} className="rounded-[20px] border border-line bg-bg p-6">
                  <p className="num">{step.label}</p>
                  <h3 className="mt-3 text-xl font-bold leading-snug">{fmt(step.title)}</h3>
                  <p className="mt-2 text-muted">{fmt(step.text)}</p>
                  <p className="mt-5 border-t border-line pt-4 font-bold">{fmt(step.price)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 9. Чему учат на «НЛП Практик» */}
        <section className="section">
          <div className="container-page">
            <Head eyebrow={l.program.eyebrow} title={l.program.title} />
            <ol className="mt-10 border-b border-line">
              {l.program.modules.map((module, i) => (
                <li key={module.title} className="grid gap-2 border-t border-line py-6 sm:grid-cols-[72px_260px_1fr] sm:gap-6">
                  <span className="num">0{i + 1}</span>
                  <h3 className="text-xl font-bold leading-snug">{module.title}</h3>
                  <p className="text-muted">{module.text}</p>
                </li>
              ))}
            </ol>
            <ul className="mt-8 flex flex-wrap gap-2">
              {l.program.format.map((item) => (
                <li key={item} className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 10. Вопросы */}
        <section className="section">
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

        {/* 11. Финальный призыв */}
        <section className="section">
          <div className="container-page">
            <h2 className="text-[40px] font-extrabold leading-[1.02] sm:text-[72px]">{l.final.title}</h2>
            <p className="mt-5 max-w-xl text-lg text-muted">{l.final.text}</p>
            <div className="mt-8">
              <TestCta />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter padForStickyCta />
      <StickyCta href="/test" label={t.common.takeTest} />
    </>
  );
}
