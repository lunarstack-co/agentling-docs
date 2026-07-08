import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const FONTS_DIR = path.join(process.cwd(), "src/assets/fonts");

type OgFont = NonNullable<
  NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]
>[number];

let fonts: OgFont[] | null = null;

/** Brand fonts for the card, loaded once per process. */
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
      data: fs.readFileSync(
        path.join(FONTS_DIR, "JetBrainsMono-SemiBold.ttf"),
      ),
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
 * Shared 1200x630 Open Graph card used by every route: dark brand
 * background, terminal mark, an eyebrow for context, and the page title.
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
          padding: "64px 72px",
          backgroundColor: "#0b0e14",
          backgroundImage:
            "radial-gradient(circle at 12% -10%, rgba(52, 211, 153, 0.22), transparent 55%), radial-gradient(circle at 100% 110%, rgba(52, 211, 153, 0.10), transparent 45%)",
          color: "#e8ecf4",
          fontFamily: "IBM Plex Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              backgroundColor: "#0e1219",
              border: "2px solid #2b3345",
              color: "#34d399",
              fontSize: 28,
              fontWeight: 600,
              fontFamily: "JetBrains Mono",
            }}
          >
            {">_"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 600,
              fontFamily: "JetBrains Mono",
            }}
          >
            <span>agent</span>
            <span style={{ color: "#34d399" }}>ling</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 600,
              fontFamily: "JetBrains Mono",
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#34d399",
            }}
          >
            {truncate(eyebrow, 48)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 74,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            {truncate(title, 72)}
          </div>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.4,
                color: "#98a3b8",
                maxWidth: 950,
              }}
            >
              {truncate(subtitle, 120)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "#5f6b82",
          }}
        >
          <div style={{ display: "flex" }}>agentling.dev</div>
          <div style={{ display: "flex" }}>Open source · MIT · Python 3.11+</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: loadFonts() },
  );
}
