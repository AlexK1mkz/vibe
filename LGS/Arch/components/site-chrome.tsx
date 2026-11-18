import Image from "next/image";
import Link from "next/link";
import { funnel } from "@/config/funnel";
import { getDictionary } from "@/dictionaries";

const t = getDictionary();

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label={t.brand.name}>
      <Image src="/brand/logo.png" alt={t.brand.logoAlt} width={72} height={24} priority sizes="72px" style={{ height: 24, width: "auto" }} />
      <span className="hidden border-l border-line pl-3 text-[11px] font-semibold leading-tight text-muted sm:block">
        Институт современного
        <br />
        <span className="tracking-[0.12em] text-ink">NLP / LGS</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ cta = true, minimal = false }: { cta?: boolean; minimal?: boolean }) {
  return (
    <header className="border-b border-line/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        {!minimal && (
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <Link href="/specialists" className="hidden px-2 py-2 text-muted hover:text-ink sm:block">
              {t.header.forSpecialists}
            </Link>
            {cta && (
              <Link href="/test" className="btn btn-primary !min-h-11 !px-4 !py-2 !text-sm">
                {t.common.takeTest}
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ padForStickyCta = false }: { padForStickyCta?: boolean }) {
  return (
    <footer className={`on-dark bg-deep text-white/80 ${padForStickyCta ? "pb-28 sm:pb-0" : ""}`}>
      <div className="container-page grid gap-8 py-12 text-sm sm:grid-cols-2">
        <div>
          <p className="text-base font-bold text-white">{t.brand.name}</p>
          <p className="mt-1">{t.footer.tagline}</p>
          <p className="mt-5">
            <a href={funnel.contacts.phoneHref} className="font-semibold text-white">
              {funnel.contacts.phone}
            </a>
            <br />
            <a href={`mailto:${funnel.contacts.email}`} className="underline">
              {funnel.contacts.email}
            </a>
            <br />
            <a href={funnel.contacts.whatsappHref} className="underline" rel="noopener">
              {t.common.whatsapp}
            </a>
          </p>
        </div>
        <div>
          <p>
            {funnel.legal.company} · {t.footer.binLabel} {funnel.legal.bin}
          </p>
          <p className="mt-1">{funnel.legal.address}</p>
          <p className="mt-1">
            {t.footer.contactNote}: {funnel.contacts.email} · {funnel.contacts.phone}
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/privacy" className="underline">
                {t.footer.links.privacy}
              </Link>
            </li>
            <li>
              <Link href="/offer" className="underline">
                {t.footer.links.offer}
              </Link>
            </li>
            <li>
              <Link href="/specialists" className="underline">
                {t.footer.links.specialists}
              </Link>
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/60 sm:col-span-2">
          {t.footer.disclaimer} © {new Date().getFullYear()} {t.brand.name}
        </p>
      </div>
    </footer>
  );
}

/** Кнопка «Пройти тест» с подписью. На тёмном фоне используйте tone="lime". */
export function TestCta({ tone = "primary", note = true }: { tone?: "primary" | "lime"; note?: boolean }) {
  return (
    <div>
      <Link href="/test" className={`btn ${tone === "lime" ? "btn-lime" : "btn-primary"} w-full sm:w-auto sm:min-w-64`}>
        {t.common.takeTest}
        <span aria-hidden="true">→</span>
      </Link>
      {note && (
        <p className={`mt-3 text-sm ${tone === "lime" ? "text-white/70" : "text-muted"}`}>{t.common.takeTestNote}</p>
      )}
    </div>
  );
}

/** На мобильном кнопка закреплена внизу экрана (ТЗ, п. 4.1) */
export function StickyTestCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
      <Link href="/test" className="btn btn-primary w-full">
        {t.common.takeTest}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
