// Generates every logo file the site needs from the one logo sheet the
// designer (an image AI) produced: public/brand/marquee-logo-sheet.png.
//
//   node scripts/brand-assets.mjs
//
// The sheet's artwork sits on a slightly noisy dark background. Instead of
// cropping that background along, we "un-mix" it: each pixel's brightness
// becomes transparency, so the gold and off-white come out clean, and every
// icon is rebuilt on the exact brand colour (#0E0F11).
//
// Outputs:
//   public/brand/marquee-symbol.png   ticket symbol, transparent
//   public/brand/marquee-logo.png     symbol + wordmark, transparent
//   public/brand/icon-192.png, icon-512.png, icon-maskable-512.png   (web app manifest)
//   src/app/favicon.ico (16, 32, 48)   browser tab
//   src/app/icon.png (512)             modern browsers, search results
//   src/app/apple-icon.png (180)       iPhone home screen
//   src/app/opengraph-image.png (1200×630)   link previews

import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const SHEET = "public/brand/marquee-logo-sheet.png";
// Bounding boxes measured on the sheet (x, y, width, height), with a little air.
const SYMBOL = { left: 186, top: 236, width: 450, height: 236 };
const LOCKUP = { left: 852, top: 259, width: 1155, height: 206 };

const CANVAS = { r: 14, g: 15, b: 17 }; // #0E0F11
const BRASS = { r: 228, g: 168, b: 83 }; // #E4A853
const SHEET_BG = { r: 10, g: 9, b: 12 }; // the sheet's own background

/** Crop a region and turn the dark background into transparency. */
async function unmix(region) {
  const { data, info } = await sharp(SHEET).extract(region).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    const [r, g, b] = [data[p * 3], data[p * 3 + 1], data[p * 3 + 2]];
    let a = (Math.max(r, g, b) - 22) / (215 - 22); // dark noise → 0, full artwork → 1
    a = Math.min(1, Math.max(0, a));
    if (a < 0.06) a = 0;
    // Remove the background's share of the colour, so edges don't look grey.
    const un = (c, bg) => (a > 0 ? Math.min(255, Math.max(0, (c - bg * (1 - a)) / a)) : 0);
    out[p * 4] = un(r, SHEET_BG.r);
    out[p * 4 + 1] = un(g, SHEET_BG.g);
    out[p * 4 + 2] = un(b, SHEET_BG.b);
    out[p * 4 + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
}

/** Same shape, but painted in the exact brand brass (the symbol is single-colour). */
async function recolor(png, color) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  for (let p = 0; p < info.width * info.height; p++) {
    data[p * 4] = color.r;
    data[p * 4 + 1] = color.g;
    data[p * 4 + 2] = color.b;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** The symbol centred in a square: on a brand-colour tile (optionally rounded), or on nothing. */
async function tile(symbol, size, { scale, radius = 0, transparent = false }) {
  const mark = await sharp(symbol).resize({ width: Math.round(size * scale) }).toBuffer();
  if (transparent) {
    return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: mark, gravity: "centre" }])
      .png()
      .toBuffer();
  }
  const shape = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="rgb(${CANVAS.r},${CANVAS.g},${CANVAS.b})"/></svg>`,
  );
  return sharp(shape).composite([{ input: mark, gravity: "centre" }]).png().toBuffer();
}

/** .ico = a tiny header + directory, then the PNG images themselves. */
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const symbol = await recolor(await unmix(SYMBOL), BRASS);
const lockup = await unmix(LOCKUP);

await sharp(symbol).toFile("public/brand/marquee-symbol.png");
await sharp(lockup).toFile("public/brand/marquee-logo.png");

// Browser icon: just the ticket, transparent around it (no dark square).
// Home-screen icons keep a dark tile: iOS and Android fill transparency with
// black or white anyway. Apple rounds the corners itself; "maskable" icons get
// cropped by Android into its own shape, so the symbol keeps a safe zone.
await writeFile("src/app/icon.png", await tile(symbol, 512, { scale: 0.96, transparent: true }));
await writeFile("src/app/apple-icon.png", await tile(symbol, 180, { scale: 0.74 }));
await writeFile("public/brand/icon-192.png", await tile(symbol, 192, { scale: 0.8, radius: 42 }));
await writeFile("public/brand/icon-512.png", await tile(symbol, 512, { scale: 0.8, radius: 112 }));
await writeFile("public/brand/icon-maskable-512.png", await tile(symbol, 512, { scale: 0.62 }));

// Tiny favicons: the ticket edge to edge on a transparent square, so the "M" stays as big as possible.
const favicons = [];
for (const size of [16, 32, 48]) favicons.push({ size, data: await tile(symbol, size, { scale: 1, transparent: true }) });
await writeFile("src/app/favicon.ico", ico(favicons));

// Link preview card: logo centred on the canvas with a soft brass glow + tagline.
const og = Buffer.from(`<svg width="1200" height="630">
  <defs><radialGradient id="glow" cx="50%" cy="0%" r="75%">
    <stop offset="0%" stop-color="rgb(228,168,83)" stop-opacity="0.16"/>
    <stop offset="100%" stop-color="rgb(228,168,83)" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="1200" height="630" fill="rgb(${CANVAS.r},${CANVAS.g},${CANVAS.b})"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="600" y="455" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="22" letter-spacing="7" fill="rgb(163,158,149)">FIND YOUR NEXT SCREENING</text>
</svg>`);
const ogLogo = await sharp(lockup).resize({ width: 720 }).toBuffer();
const { height: ogLogoHeight } = await sharp(ogLogo).metadata();
await sharp(og)
  .composite([{ input: ogLogo, left: 240, top: Math.round(300 - ogLogoHeight / 2) }])
  .png()
  .toFile("src/app/opengraph-image.png");

console.log("Brand assets written.");
