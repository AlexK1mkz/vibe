import Link from "next/link";
import { SiteHeader } from "@/components/site-chrome";
import { getDictionary } from "@/dictionaries";

const t = getDictionary();

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="content" className="container-narrow py-24 text-center">
        <h1 className="text-4xl font-extrabold">{t.notFound.title}</h1>
        <p className="mt-3 text-lg text-muted">{t.notFound.text}</p>
        <Link href="/" className="btn btn-primary mt-8">
          {t.common.home}
        </Link>
      </main>
    </>
  );
}
