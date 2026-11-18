import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SpecialistForm } from "@/components/specialist-form";
import { getDictionary } from "@/dictionaries";

const t = getDictionary();
const s = t.specialists;

export const metadata: Metadata = { title: s.metaTitle, description: s.metaDescription };

export default function SpecialistsPage() {
  return (
    <>
      <SiteHeader cta={false} />
      <main id="content">
        <section className="container-page pb-12 pt-10 sm:pt-16">
          <p className="eyebrow">{s.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-[34px] font-extrabold leading-[1.08] sm:text-5xl">{s.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{s.lead}</p>
          <a href="#form" className="btn btn-primary mt-8 w-full sm:w-auto">
            {s.cta} <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="border-t border-line bg-white py-12 sm:py-16">
          <div className="container-page">
            <h2 className="text-[28px] font-bold sm:text-4xl">{s.rolesTitle}</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {s.roles.map((role) => (
                <li key={role.name} className="rounded-[20px] border border-line bg-cream p-6">
                  <h3 className="text-xl font-bold">{role.name}</h3>
                  <p className="mt-2">{role.who}</p>
                  <p className="mt-4 border-t border-line pt-4 text-sm text-muted">{role.gets || s.rolePending}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl border-l-2 border-green pl-4 text-muted">{s.payNote}</p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container-page grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-[28px] font-bold sm:text-4xl">{s.selectionTitle}</h2>
              <ol className="mt-8 grid gap-6">
                {s.selection.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-extrabold text-deep">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold leading-snug">{step.title}</h3>
                      <p className="mt-1 text-muted">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <SpecialistForm strings={s.form} shared={t.contactForm} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
