import { funnel } from "@/config/funnel";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { fmt, getDictionary } from "@/dictionaries";

const t = getDictionary();

/**
 * TODO(content): тексты политики и оферты даёт заказчик (ТЗ, п. 4 и вопрос 8 раздела 14).
 * До этого страница честно говорит, что документ готовится, и ведёт на действующую редакцию.
 */
export function LegalPage({ title, currentUrl, showDeletion }: { title: string; currentUrl: string; showDeletion?: boolean }) {
  return (
    <>
      <SiteHeader cta={false} />
      <main id="content" className="container-narrow py-12 sm:py-16">
        <h1 className="text-[30px] font-extrabold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-5 text-lg">{t.legal.pending}</p>
        <a href={currentUrl} className="btn btn-ghost mt-6" rel="noopener">
          {t.legal.currentLink} ↗
        </a>
        <h2 className="mt-10 text-xl font-bold">{t.legal.operator}</h2>
        <p className="mt-2 text-muted">
          {funnel.legal.company}, {t.footer.binLabel} {funnel.legal.bin}
          <br />
          {funnel.legal.address}
          <br />
          {funnel.contacts.email} · {funnel.contacts.phone}
        </p>
        {showDeletion && <p className="mt-6">{fmt(t.legal.deletion)}</p>}
      </main>
      <SiteFooter />
    </>
  );
}
