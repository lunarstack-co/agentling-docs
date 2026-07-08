import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon; iOS ignores SVG favicons, so this renders a PNG. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0e1219",
        }}
      >
        <svg width="124" height="124" viewBox="0 0 32 32" fill="none">
          <path
            d="M9 11.5L14.5 16L9 20.5"
            stroke="#34d399"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 21.5H23"
            stroke="#e8ecf4"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
