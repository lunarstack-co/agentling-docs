import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

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
              fontWeight: 700,
            }}
          >
            {">_"}
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            <span>agent</span>
            <span style={{ color: "#34d399" }}>ling</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
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
              fontWeight: 700,
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
    OG_SIZE,
  );
}
