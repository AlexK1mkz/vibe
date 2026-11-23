import { getDictionary } from "@/dictionaries";
import landing from "@/content/landing.json";
import { ceilingName, isCeiling } from "@/lib/content";
import { getLead } from "@/lib/leads";
import { ogImage, OG_SIZE } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
const t = getDictionary();

export const alt = t.result.ogAlt;

/** В картинке результата только название потолка: без имени и других личных данных */
export default async function Image({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const lead = await getLead(publicId).catch(() => null);
  const known = lead && isCeiling(lead.ceiling);
  return ogImage({
    eyebrow: (known ? t.result.ogEyebrow : landing.hero.eyebrow).toUpperCase(),
    title: known ? ceilingName(lead.ceiling) : t.meta.ogTitle,
    subtitle: t.result.ogSubtitle,
  });
}
