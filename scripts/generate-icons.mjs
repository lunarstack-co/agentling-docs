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
 * Rasters cannot follow the viewer's theme, so each one is the white mark
 * on a black tile, which reads on light and dark surfaces.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const TILE = "#000000";
const MARK = "#ffffff";

/** The small-size cut of the mark on a 256-unit grid, drawn for light-on-dark. */
const MARK_D = "M97.75 196.5Q68.55 196.5 47.9 175.85Q27.25 155.2 27.25 126Q27.25 96.8 47.9 76.15Q68.55 55.5 97.75 55.5L147.75 55.5C159.07 55.5 168.25 64.68 168.25 76L168.25 155.5L208.25 155.5C219.57 155.5 228.75 164.68 228.75 176C228.75 187.32 219.57 196.5 208.25 196.5ZM127.25 126Q127.25 113.78 118.61 105.14Q109.97 96.5 97.75 96.5Q85.53 96.5 76.89 105.14Q68.25 113.78 68.25 126Q68.25 138.22 76.89 146.86Q85.53 155.5 97.75 155.5L127.25 155.5Z";

function markSvg({ size, pad = 0, radius = 0 }) {
  const scale = (size - pad * 2) / 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${TILE}"/>
    <g transform="translate(${pad} ${pad}) scale(${scale})"><path fill="${MARK}" d="${MARK_D}"/></g>
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

// favicon.ico cannot follow the colour scheme, so it sits on the black tile.
// Browsers that support SVG favicons use icon.svg instead, which does.
write(
  "src/app/favicon.ico",
  ico([
    { size: 32, data: await png(markSvg({ size: 32, pad: 3, radius: 6 }), 32) },
    { size: 16, data: await png(markSvg({ size: 16, pad: 1, radius: 3 }), 16) },
  ]),
);

// Apple touch icon: iOS adds its own corner radius; solid ground, 12% padding.
write("src/app/apple-icon.png", await png(markSvg({ size: 180, pad: 22 }), 180));

// PWA icons on a solid ground. The maskable one keeps the mark inside the
// central 80% safe zone.
write("public/icon-192.png", await png(markSvg({ size: 192, pad: 24, radius: 36 }), 192));
write("public/icon-512.png", await png(markSvg({ size: 512, pad: 64, radius: 96 }), 512));
write("public/icon-512-maskable.png", await png(markSvg({ size: 512, pad: 128 }), 512));

console.log("Done");
