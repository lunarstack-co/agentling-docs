#!/usr/bin/env node
/**
 * Regenerates every raster icon from the mark's geometry so the set never
 * drifts from src/app/icon.svg.
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes:
 *   src/app/favicon.ico             32 and 16, PNG-compressed entries
 *   src/app/apple-icon.png          180, solid paper ground, padded
 *   public/icon-192.png             PWA
 *   public/icon-512.png             PWA
 *   public/icon-512-maskable.png    PWA, mark inside the 80% safe zone
 *
 * Colours are the light-theme tokens from globals.css. Rasters cannot
 * follow the viewer's theme, so they use the paper ground, which is also
 * the Open Graph card's ground.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PAPER = "#fafaf7";
const INK = "#1a1a18";
const ACCENT = "#4338ca";

/** The mark on a 32-unit grid, with a separate 16-unit drawing for 16px. */
function markSvg({ size, ground, pad = 0, radius = 0 }) {
  const grid = size <= 16 ? 16 : 32;
  const bars =
    grid === 16
      ? `<rect x="3" y="3" width="10" height="2" rx="1" fill="${INK}"/>
         <rect x="3" y="7" width="7" height="2" rx="1" fill="${INK}"/>
         <rect x="3" y="11" width="4" height="2" rx="1" fill="${ACCENT}"/>`
      : `<rect x="7" y="7" width="18" height="4" rx="2" fill="${INK}"/>
         <rect x="7" y="14" width="12" height="4" rx="2" fill="${INK}"/>
         <rect x="7" y="21" width="6" height="4" rx="2" fill="${ACCENT}"/>`;
  const inner = size - pad * 2;
  const scale = inner / grid;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${ground ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${ground}"/>` : ""}
    <g transform="translate(${pad} ${pad}) scale(${scale})">${bars}</g>
  </svg>`;
}

async function png(svg, size) {
  return sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer();
}

/** Packs PNG images into a .ico container (ICONDIR + ICONDIRENTRY per image). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  const blobs = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    blobs.push(data);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

function write(rel, data) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log(`  ${rel} (${data.length} bytes)`);
}

console.log("Generating icons");

// favicon.ico: transparent ground so it works on light and dark tab strips.
write(
  "src/app/favicon.ico",
  ico([
    { size: 32, data: await png(markSvg({ size: 32 }), 32) },
    { size: 16, data: await png(markSvg({ size: 16 }), 16) },
  ]),
);

// Apple touch icon: iOS adds its own corner radius; solid ground, 12% padding.
write("src/app/apple-icon.png", await png(markSvg({ size: 180, ground: PAPER, pad: 22 }), 180));

// PWA icons on a solid ground. The maskable one keeps the mark inside the
// central 80% safe zone.
write("public/icon-192.png", await png(markSvg({ size: 192, ground: PAPER, pad: 24, radius: 36 }), 192));
write("public/icon-512.png", await png(markSvg({ size: 512, ground: PAPER, pad: 64, radius: 96 }), 512));
write("public/icon-512-maskable.png", await png(markSvg({ size: 512, ground: PAPER, pad: 128 }), 512));

console.log("Done");
