import landing from "@/content/landing.json";
import specialists from "@/content/specialists.json";
import { ogImage, OG_SIZE } from "@/lib/og";
import { currentSite } from "@/lib/site";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Институт современного NLP / LGS";

/** Картинка для ссылок: у каждого из двух сайтов своя */
export default function Image() {
  if (currentSite() === "specialists") {
    const hero = (specialists as { hero: { title: string } }).hero;
    return ogImage({ eyebrow: "НЛП-СПЕЦИАЛИСТАМ", title: hero.title, subtitle: "Практика, рост, клиенты" });
  }
  return ogImage({ eyebrow: "БЕСПЛАТНЫЙ ТЕСТ · 3 МИНУТЫ", title: landing.hero.title, subtitle: landing.hero.note });
}
