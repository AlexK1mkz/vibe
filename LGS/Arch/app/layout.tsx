import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { getDictionary } from "@/dictionaries";
import { siteUrl } from "@/lib/server-utils";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

const t = getDictionary();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: t.meta.title, template: `%s · ${t.brand.short}` },
  description: t.meta.description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: t.brand.name,
    title: t.meta.ogTitle,
    description: t.meta.description,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#070606",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable} data-scroll-behavior="smooth">
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
        >
          {t.common.skipToContent}
        </a>
        {children}
        <AnalyticsProvider
          ids={{
            meta: process.env.META_PIXEL_ID || undefined,
            ga4: process.env.GA4_ID || undefined,
            ym: process.env.YM_ID || undefined,
          }}
          text={t.cookie}
        />
      </body>
    </html>
  );
}
