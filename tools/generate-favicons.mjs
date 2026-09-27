/**
 * Rasterizes static/favicon.svg into the favicon set referenced by
 * src/app.html. Uses playwright (already a devDependency for visual
 * regression) instead of adding an image-rasterization library.
 *
 *   node tools/generate-favicons.mjs
 *
 * Re-run after editing favicon.svg.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const staticDir = path.join(root, 'static');
const svg = readFileSync(path.join(staticDir, 'favicon.svg'), 'utf8');

// iOS applies its own corner mask to the apple-touch-icon and ignores alpha,
// so that one render is a flat, full-bleed, opaque square rather than the
// inset rounded rect the other sizes use.
const flatSvg = svg.replace(
  'x="2" y="2" width="60" height="60" rx="13" ry="13"',
  'x="0" y="0" width="64" height="64"',
);

async function render(page, markup, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><html><body style="margin:0"><style>svg{width:${size}px;height:${size}px;display:block}</style>${markup}</body></html>`,
  );
  return page.screenshot({ omitBackground: true });
}

/** ICONDIR + ICONDIRENTRY headers wrapping PNG-compressed frames (supported since Windows Vista). */
function packIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (const png of pngBuffers) {
    // PNG IHDR stores width/height as big-endian uint32s at fixed offsets.
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // no palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

const icoPngs = [];
for (const size of [16, 32, 48]) {
  icoPngs.push(await render(page, svg, size));
}
writeFileSync(path.join(staticDir, 'favicon.ico'), packIco(icoPngs));

writeFileSync(path.join(staticDir, 'apple-touch-icon.png'), await render(page, flatSvg, 180));
writeFileSync(path.join(staticDir, 'web-app-manifest-192x192.png'), await render(page, svg, 192));
writeFileSync(path.join(staticDir, 'web-app-manifest-512x512.png'), await render(page, svg, 512));

await browser.close();
console.log('Wrote favicon.ico, apple-touch-icon.png and manifest icons to static/.');
