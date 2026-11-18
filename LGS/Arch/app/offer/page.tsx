import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getDictionary } from "@/dictionaries";

const t = getDictionary();
export const metadata: Metadata = { title: t.legal.offerTitle };

export default function OfferPage() {
  return <LegalPage title={t.legal.offerTitle} currentUrl="https://institutnlp.biz/offer/" />;
}
