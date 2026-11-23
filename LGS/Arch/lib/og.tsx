import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const fontFile = (weight: number, subset: string) =>
  readFile(path.join(process.cwd(), "assets/fonts", `manrope-${subset}-${weight}-normal.woff`));

/** Картинка Open Graph в фирменном стиле: зелёный фон, лаймовый акцент */
export async function ogImage({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const [cyr800, lat800, cyr500, lat500] = await Promise.all([
    fontFile(800, "cyrillic"),
    fontFile(800, "latin"),
    fontFile(500, "cyrillic"),
    fontFile(500, "latin"),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070606",
          color: "#f6f3ee",
          padding: 72,
          fontFamily: "Manrope",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, fontWeight: 500, letterSpacing: 4, color: "#e9924b" }}>{eyebrow}</div>
        <div style={{ display: "flex", fontSize: title.length > 48 ? 68 : 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{subtitle}</div>
          <div
            style={{
              display: "flex",
              background: "#e9924b",
              color: "#120b05",
              fontSize: 30,
              fontWeight: 800,
              padding: "18px 34px",
              borderRadius: 18,
            }}
          >
            NLP / LGS
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Manrope", data: cyr800, weight: 800, style: "normal" },
        { name: "Manrope", data: lat800, weight: 800, style: "normal" },
        { name: "Manrope", data: cyr500, weight: 500, style: "normal" },
        { name: "Manrope", data: lat500, weight: 500, style: "normal" },
      ],
    },
  );
}
