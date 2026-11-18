import { getDictionary } from "@/dictionaries";
import { ogImage, OG_SIZE } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Тест «Архетип личности»";

const t = getDictionary();

export default function Image() {
  return ogImage({ eyebrow: "БЕСПЛАТНЫЙ ТЕСТ · 3 МИНУТЫ", title: t.meta.ogTitle, subtitle: "17 вопросов, результат сразу" });
}
