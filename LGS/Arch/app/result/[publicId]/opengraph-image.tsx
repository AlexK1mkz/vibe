import { getDictionary } from "@/dictionaries";
import { results, type ArchetypeCode } from "@/lib/content";
import { getLead } from "@/lib/leads";
import { ogImage, OG_SIZE } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Результат теста «Архетип личности»";

const t = getDictionary();

/** В картинке результата только название архетипа: без имени и других личных данных */
export default async function Image({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const lead = await getLead(publicId).catch(() => null);
  const title = lead
    ? lead.isPair
      ? `${results.archetypes[lead.primary as ArchetypeCode].name} и ${results.archetypes[lead.secondary as ArchetypeCode].name}`
      : results.archetypes[lead.primary as ArchetypeCode].name
    : t.meta.ogTitle;
  return ogImage({
    eyebrow: lead ? "МОЙ АРХЕТИП" : "БЕСПЛАТНЫЙ ТЕСТ · 3 МИНУТЫ",
    title,
    subtitle: "Тест за 3 минуты: как вы действуете под давлением",
  });
}
