import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const FONTS_DIR = path.join(process.cwd(), "src/assets/fonts");

/* Light-theme tokens from globals.css. The card cannot follow the viewer's
   theme, so it uses the paper ground, which also reads well in dark feeds. */
const PAPER = "#fafaf7";
const INK = "#1a1a18";
const INK_SECONDARY = "#5f6059";
const INK_TERTIARY = "#6d6e67";
const ACCENT = "#4338ca";
const HAIRLINE = "#e7e7e1";

type OgFont = NonNullable<
  NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]
>[number];

let fonts: OgFont[] | null = null;

function loadFonts(): OgFont[] {
  fonts ??= [
    {
      name: "IBM Plex Sans",
      data: fs.readFileSync(path.join(FONTS_DIR, "IBMPlexSans-Regular.ttf")),
      weight: 400,
      style: "normal",
    },
    {
      name: "IBM Plex Sans",
      data: fs.readFileSync(path.join(FONTS_DIR, "IBMPlexSans-SemiBold.ttf")),
      weight: 600,
      style: "normal",
    },
    {
      name: "JetBrains Mono",
      data: fs.readFileSync(path.join(FONTS_DIR, "JetBrainsMono-SemiBold.ttf")),
      weight: 600,
      style: "normal",
    },
  ];
  return fonts;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * The 1200x630 Open Graph card for every route: paper ground, the mark and
 * wordmark, a mono eyebrow for the section, the page title, the
 * description, and a hairline footer. Same geometry as src/app/icon.svg.
 */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 56px",
          backgroundColor: PAPER,
          color: INK,
          fontFamily: "IBM Plex Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <rect x="7" y="7" width="18" height="4" rx="2" fill={INK} />
            <rect x="7" y="14" width="12" height="4" rx="2" fill={INK} />
            <rect x="7" y="21" width="6" height="4" rx="2" fill={ACCENT} />
          </svg>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>
            Agentling
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              fontFamily: "JetBrains Mono",
              letterSpacing: 2,
              textTransform: "uppercase",
              color: ACCENT,
            }}
          >
            {truncate(eyebrow, 40)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              maxWidth: 1020,
            }}
          >
            {truncate(title, 64)}
          </div>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.4,
                color: INK_SECONDARY,
                maxWidth: 960,
              }}
            >
              {truncate(subtitle, 140)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: `1px solid ${HAIRLINE}`,
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            color: INK_TERTIARY,
          }}
        >
          <div style={{ display: "flex" }}>agentling.dev</div>
          <div style={{ display: "flex" }}>Python 3.11+ · MIT</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: loadFonts() },
  );
}
