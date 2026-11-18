import Image from "next/image";
import { SiteFooter, SiteHeader, StickyTestCta, TestCta } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";

const t = getDictionary();
const l = t.landing;

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 max-w-2xl text-[30px] font-bold leading-[1.12] sm:text-[40px]">{title}</h2>
    </>
  );
}

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="content">
        {/* 1. Первый экран: заголовок от ситуации, не от продукта */}
        <section className="container-page pb-14 pt-10 sm:pb-20 sm:pt-16">
          <p className="eyebrow flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green" />
            {l.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-[36px] font-extrabold leading-[1.05] sm:text-[60px]">{l.hero.title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-snug text-muted sm:text-xl">{l.hero.subtitle}</p>
          <div className="mt-8">
            <TestCta />
          </div>
        </section>

        {/* 2. Узнавание */}
        <section className="border-t border-line bg-white py-14 sm:py-20">
          <div className="container-page">
            <SectionHead eyebrow={l.recognition.eyebrow} title={l.recognition.title} />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {l.recognition.cards.map((card) => (
                <li key={card.job} className="rounded-[20px] border border-line bg-cream p-6">
                  <p className="eyebrow">{card.job}</p>
                  <p className="mt-3 text-xl font-bold leading-snug">«{card.quote}»</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-xl text-lg text-muted">{l.recognition.after}</p>
            <div className="mt-8">
              <TestCta />
            </div>
          </div>
        </section>

        {/* 3. Что вы получите */}
        <section className="py-14 sm:py-20">
          <div className="container-page">
            <SectionHead eyebrow={l.get.eyebrow} title={l.get.title} />
            <ol className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {l.get.items.map((item, i) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-extrabold text-deep">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold leading-snug">{item.title}</h3>
                    <p className="mt-1 text-muted">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-2xl border-l-2 border-green pl-4 text-muted">{l.get.archetypeNote}</p>
          </div>
        </section>

        {/* 4. Почему это навык */}
        <section className="on-dark bg-deep py-14 text-white sm:py-20">
          <div className="container-page">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime">{l.skill.eyebrow}</p>
            <h2 className="mt-3 max-w-3xl text-[30px] font-bold leading-[1.12] sm:text-[40px]">{l.skill.title}</h2>
            <p className="mt-5 max-w-2xl text-lg text-white/80">{l.skill.text}</p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-3">
              {l.skill.points.map((point) => (
                <li key={point.title} className="border-t border-white/25 pt-4">
                  <h3 className="text-xl font-bold text-lime">{point.title}</h3>
                  <p className="mt-1 text-white/80">{point.text}</p>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <TestCta tone="lime" />
            </div>
          </div>
        </section>

        {/* 5. Кто автор: только подтверждённые факты */}
        <section className="py-14 sm:py-20">
          <div className="container-page flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <Image
              src="/brand/saida.jpg"
              alt={l.author.photoAlt}
              width={320}
              height={320}
              sizes="(max-width: 640px) 160px, 220px"
              className="h-40 w-40 rounded-[28px] object-cover sm:h-56 sm:w-56"
            />
            <div>
              <p className="eyebrow">{l.author.eyebrow}</p>
              <h2 className="mt-3 text-[30px] font-bold leading-tight sm:text-[40px]">{l.author.name}</h2>
              <p className="mt-2 text-lg text-muted">{l.author.role}</p>
              {l.author.facts.length > 0 && (
                <ul className="mt-4 grid gap-2">
                  {l.author.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* 6. Путь */}
        <section className="border-t border-line bg-white py-14 sm:py-20">
          <div className="container-page">
            <SectionHead eyebrow={l.path.eyebrow} title={l.path.title} />
            <ol className="mt-8 grid gap-3 lg:grid-cols-4">
              {l.path.steps.map((step, i) => (
                <li key={step.title} className="relative rounded-[20px] border border-line bg-cream p-6">
                  <p className="text-sm font-extrabold text-green">
                    {i === 2 ? l.path.steps[1].or : `0${i < 2 ? i + 1 : i}`}
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-snug">{fmt(step.title)}</h3>
                  <p className="mt-2 text-muted">{fmt(step.text)}</p>
                  <p className="mt-4 font-bold">{fmt(step.price)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. Вопросы */}
        <section className="py-14 sm:py-20">
          <div className="container-page">
            <SectionHead eyebrow={l.faq.eyebrow} title={l.faq.title} />
            <div className="mt-8 max-w-3xl divide-y divide-line border-y border-line">
              {l.faq.items.map((item) => (
                <details key={item.q} className="group py-1">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-bold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="text-2xl font-normal text-green transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 pr-8 text-muted">{fmt(item.a)}</p>
                </details>
              ))}
            </div>
            <div className="mt-12 rounded-[24px] bg-lime/50 p-7 sm:p-10">
              <h2 className="max-w-xl text-[26px] font-bold leading-tight sm:text-[32px]">{l.finalCta.title}</h2>
              <p className="mt-2 text-muted">{l.finalCta.text}</p>
              <div className="mt-6">
                <TestCta />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter padForStickyCta />
      <StickyTestCta />
    </>
  );
}
