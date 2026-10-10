// Builds every logo/icon size from the church crest supplied in branding/pcglogo.png.
// The artwork is never redrawn: it is only resized and padded. Run: node scripts/build-brand-assets.mjs (from frontend/).
//
// The supplied PNG has transparent "white" areas (cross, saltire, ribbon). A filled copy turns only the enclosed
// transparent areas white, so the crest looks right on dark backgrounds; the outside stays transparent.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../', import.meta.url));
const SOURCE = `${root}branding/pcglogo.png`;
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

const out = (relative) => {
  const path = `${root}${relative}`;
  mkdirSync(dirname(path), { recursive: true });
  return path;
};

// Enclosed transparent pixels (not reachable from the image edge) become opaque white.
async function filledCrest() {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const outside = new Uint8Array(width * height);
  const queue = [];
  const clear = (i) => data[i * 4 + 3] < 128;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (outside[i] || !clear(i)) return;
    outside[i] = 1;
    queue.push(i);
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (queue.length > 0) {
    const i = queue.pop();
    const x = i % width;
    const y = (i - x) / width;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  const filled = Buffer.from(data);
  for (let i = 0; i < width * height; i += 1) {
    if (outside[i]) continue;
    // Blend inside pixels over white so anti-aliased edges inside the crest stay smooth.
    const a = data[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c += 1) filled[i * 4 + c] = Math.round(data[i * 4 + c] * a + 255 * (1 - a));
    filled[i * 4 + 3] = 255;
  }
  return sharp(filled, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

// The crest fitted inside a square canvas, taking `fraction` of its height (centred).
async function onSquare(crest, size, fraction, background) {
  const inner = Math.round(size * fraction);
  const resized = await sharp(crest).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: resized, gravity: 'centre' }])
    .png();
}

const crest = await filledCrest();
await sharp(crest).toFile(out('branding/pcglogo-filled.png'));

// Website
await sharp(crest).resize({ height: 256 }).png().toFile(out('frontend/public/brand/crest.png'));
await (await onSquare(crest, 512, 0.84, WHITE)).toFile(out('frontend/src/app/icon.png'));
await (await onSquare(crest, 180, 0.84, WHITE)).toFile(out('frontend/src/app/apple-icon.png'));
await (await onSquare(crest, 192, 0.84, WHITE)).toFile(out('frontend/public/icons/icon-192.png'));
await (await onSquare(crest, 512, 0.84, WHITE)).toFile(out('frontend/public/icons/icon-512.png'));
// Maskable icons keep the crest inside the 80% safe zone.
await (await onSquare(crest, 192, 0.66, WHITE)).toFile(out('frontend/public/icons/maskable-192.png'));
await (await onSquare(crest, 512, 0.66, WHITE)).toFile(out('frontend/public/icons/maskable-512.png'));

// Mobile app
// App-store icons must be opaque (no alpha channel).
await sharp(await (await onSquare(crest, 1024, 0.84, WHITE)).toBuffer())
  .flatten({ background: WHITE })
  .removeAlpha()
  .png()
  .toFile(out('mobile/assets/images/icon.png'));
await (await onSquare(crest, 1024, 0.62, CLEAR)).toFile(out('mobile/assets/images/android-icon-foreground.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: WHITE } }).png().toFile(out('mobile/assets/images/android-icon-background.png'));
// Themed (monochrome) icon: the original artwork's shape, where the transparent cross/saltire read as cut-outs.
const silhouette = await sharp(SOURCE)
  .ensureAlpha()
  .composite([{ input: { create: { width: 736, height: 950, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }, blend: 'in' }])
  .png()
  .toBuffer();
await (await onSquare(silhouette, 1024, 0.62, CLEAR)).toFile(out('mobile/assets/images/android-icon-monochrome.png'));
await (await onSquare(crest, 1024, 0.9, CLEAR)).toFile(out('mobile/assets/images/splash-icon.png'));
await (await onSquare(crest, 48, 0.9, WHITE)).toFile(out('mobile/assets/images/favicon.png'));

console.log('Brand assets written from branding/pcglogo.png');
