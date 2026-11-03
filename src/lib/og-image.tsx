import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

import { MARK_PATH } from "@/lib/brand-mark";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const FONTS_DIR = path.join(process.cwd(), "src/assets/fonts");

/* Light tokens from globals.css. The card cannot follow the viewer's theme,
   so it uses the light ground, which also reads well in dark feeds. */
const PAPER = "#ffffff";
const INK = "#1f2328";
const INK_SECONDARY = "#59636e";
const INK_TERTIARY = "#59636e";
const ACCENT = "#1f2328";
const HAIRLINE = "#d1d9e0";

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
 * The 1200x630 Open Graph card for every route: light ground, the mark and
 * wordmark, a mono eyebrow for the section, the page title, the
 * description, and a hairline footer. Same geometry as src/app/icon.svg.
 */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
  footerNote = "Python 3.11+ · MIT",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Right-hand footer text; the Python version and licence by default. */
  footerNote?: string;
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
          <svg width="44" height="44" viewBox="0 0 256 256" fill={INK}>
            <path d={MARK_PATH} />
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
          <div style={{ display: "flex" }}>{footerNote}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: loadFonts() },
  );
}
