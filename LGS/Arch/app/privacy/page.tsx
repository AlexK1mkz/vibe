import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getDictionary } from "@/dictionaries";

const t = getDictionary();
export const metadata: Metadata = { title: t.legal.privacyTitle };

export default function PrivacyPage() {
  return <LegalPage title={t.legal.privacyTitle} currentUrl="https://institutnlp.biz/privacy/" showDeletion />;
}
