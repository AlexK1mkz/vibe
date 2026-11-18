import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-chrome";
import { getDictionary } from "@/dictionaries";
import { getLead, setOptOut } from "@/lib/leads";

const t = getDictionary();

export const metadata: Metadata = { title: t.unsubscribe.title, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Отписка от цепочки WhatsApp: ссылка есть в каждом сообщении (ТЗ, п. 7.3).
 * Отписка происходит по кнопке, а не по открытию ссылки: мессенджеры сами открывают
 * ссылки для предпросмотра, и человек не должен отписываться из-за этого.
 */
export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { publicId } = await params;
  const done = (await searchParams).done === "1";
  const lead = await getLead(publicId).catch(() => null);

  async function unsubscribe() {
    "use server";
    await setOptOut(publicId);
    redirect(`/unsubscribe/${publicId}?done=1`);
  }

  return (
    <>
      <SiteHeader cta={false} />
      <main id="content" className="container-narrow py-20">
        {!lead ? (
          <h1 className="text-3xl font-extrabold">{t.unsubscribe.notFound}</h1>
        ) : done || lead.whatsappOptOut ? (
          <>
            <h1 className="text-3xl font-extrabold">{t.unsubscribe.title}</h1>
            <p className="mt-4 text-lg text-muted">{t.unsubscribe.text}</p>
          </>
        ) : (
          <form action={unsubscribe}>
            <h1 className="text-3xl font-extrabold">{t.unsubscribe.confirmTitle}</h1>
            <p className="mt-4 text-lg text-muted">{t.unsubscribe.confirmText}</p>
            <button type="submit" className="btn btn-primary mt-8">
              {t.unsubscribe.confirm}
            </button>
          </form>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {lead && (
            <Link href={`/result/${publicId}`} className="btn btn-ghost">
              {t.thanks.toResult}
            </Link>
          )}
          <Link href="/" className="btn btn-ghost">
            {t.common.home}
          </Link>
        </div>
      </main>
    </>
  );
}
