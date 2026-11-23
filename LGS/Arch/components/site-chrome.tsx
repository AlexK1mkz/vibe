import Image from "next/image";
import Link from "next/link";
import { funnel } from "@/config/funnel";
import { getDictionary } from "@/dictionaries";
import { clientHref, currentSite, specialistsHref } from "@/lib/site";

const t = getDictionary();

/** Ссылка внутри сайта или на второй домен */
export function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label={t.brand.name}>
      {/* Логотип тёмный: на чёрном фоне выводим его белым */}
      <Image
        src="/brand/logo.png"
        alt={t.brand.logoAlt}
        width={72}
        height={24}
        priority
        sizes="72px"
        style={{ height: 22, width: "auto", filter: "brightness(0) invert(1)" }}
      />
      <span className="hidden border-l border-line pl-3 text-[11px] font-semibold leading-tight text-muted sm:block">
        Институт современного
        <br />
        <span className="tracking-[0.12em] text-ink">NLP / LGS</span>
      </span>
    </Link>
  );
}

export function SiteHeader({
  cta = true,
  minimal = false,
  variant,
}: {
  cta?: boolean;
  minimal?: boolean;
  /** Чей это лендинг. По умолчанию определяется по SITE. */
  variant?: "client" | "specialists";
}) {
  const kind = variant ?? (currentSite() === "specialists" ? "specialists" : "client");
  return (
    <header className="border-b border-line">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        {!minimal && (
          <nav className="flex items-center gap-3 text-sm font-semibold">
            {kind === "client" ? (
              <>
                <SmartLink href={specialistsHref()} className="hidden px-2 py-2 text-muted hover:text-ink sm:block">
                  {t.header.forSpecialists}
                </SmartLink>
                {cta && (
                  <Link href="/test" className="btn btn-primary !min-h-11 !px-4 !py-2 !text-sm">
                    {t.common.takeTest}
                  </Link>
                )}
              </>
            ) : (
              cta && (
                <a href="#form" className="btn btn-primary !min-h-11 !px-4 !py-2 !text-sm">
                  {t.header.fillForm}
                </a>
              )
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ padForStickyCta = false }: { padForStickyCta?: boolean }) {
  const site = currentSite();
  return (
    <footer className={`border-t border-line bg-surface text-muted ${padForStickyCta ? "pb-28 sm:pb-0" : ""}`}>
      <div className="container-page grid gap-8 py-12 text-sm sm:grid-cols-2">
        <div>
          <p className="text-base font-bold text-ink">{t.brand.name}</p>
          <p className="mt-1">{t.footer.tagline}</p>
          <p className="mt-5">
            <a href={funnel.contacts.phoneHref} className="font-semibold text-ink">
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
              {site === "specialists" ? (
                <SmartLink href={clientHref("/")} className="underline">
                  {t.footer.links.client}
                </SmartLink>
              ) : (
                <SmartLink href={specialistsHref()} className="underline">
                  {t.footer.links.specialists}
                </SmartLink>
              )}
            </li>
          </ul>
        </div>
        <p className="text-xs sm:col-span-2">
          {site === "specialists" ? "" : `${t.footer.disclaimer} `}© {new Date().getFullYear()} {t.brand.name}
        </p>
      </div>
    </footer>
  );
}

/** Кнопка «Пройти тест» с подписью */
export function TestCta({ note = true }: { note?: boolean }) {
  return (
    <div>
      <Link href="/test" className="btn btn-primary w-full sm:w-auto sm:min-w-64">
        {t.common.takeTest}
        <span aria-hidden="true">→</span>
      </Link>
      {note && <p className="mt-3 text-sm text-muted">{t.common.takeTestNote}</p>}
    </div>
  );
}

/** На мобильном кнопка закреплена внизу экрана */
export function StickyCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
      <SmartLink href={href} className="btn btn-primary w-full">
        {label}
        <span aria-hidden="true">→</span>
      </SmartLink>
    </div>
  );
}

/** Портрет или плейсхолдер, пока фото не получено: TODO(content) */
export function Portrait({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div role="img" aria-label={alt} className={`photo-placeholder ${className}`}>
        {alt}
      </div>
    );
  }
  return <Image src={src} alt={alt} width={640} height={640} sizes="(max-width: 640px) 60vw, 320px" className={`object-cover ${className}`} />;
}

/** Заголовок с акцентом: слова в [квадратных скобках] выделяются акцентным цветом */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={i} className="accent">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Убирает разметку акцента: для мета-тегов и картинок */
export const plain = (text: string) => text.replace(/[\[\]]/g, "");
