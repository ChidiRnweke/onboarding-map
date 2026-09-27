/**
 * Single-shot capture of one app state, for PR evidence or an ad hoc check.
 * For a real before/after regression across viewports and themes, use
 * shoot.mjs + diff.mjs instead.
 *
 *   node tools/capture.mjs <url> <outFile> [--hash '#stage/phase/step']
 *     [--theme light|dark] [--viewport WIDTHxHEIGHT]
 *     [--open <name>=true|false ...] [--intro-seen <mapId>]
 *
 * --hash sets which stage/phase/step is open (src/lib/progress.ts).
 * --open seeds a sidebar's open-closed state before load (src/lib/sidebars.ts);
 * repeat it for more than one sidebar. --intro-seen marks the first-visit
 * intro as already seen for the given map id, so it doesn't open on load.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [url, outFile] = process.argv.slice(2);
if (!url || !outFile) {
  console.error(
    'usage: node tools/capture.mjs <url> <outFile> [--hash "#stage/phase/step"] ' +
      '[--theme light|dark] [--viewport WIDTHxHEIGHT] [--open name=bool ...] [--intro-seen mapId]',
  );
  process.exit(1);
}

const values = (flag) => process.argv.flatMap((a, i) => (a === flag ? [process.argv[i + 1]] : []));
const value = (flag) => values(flag)[0] ?? null;

const hash = value('--hash') ?? '';
const theme = value('--theme') ?? 'light';
const [width, height] = (value('--viewport') ?? '1400x900').split('x').map(Number);
const introSeenMap = value('--intro-seen');
const opens = values('--open').map((pair) => {
  const [name, open] = pair.split('=');
  return [name, open === 'true'];
});

mkdirSync(dirname(outFile), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height },
  colorScheme: theme,
  deviceScaleFactor: 2,
  // Stops the route flow and waypoint pulse, so the capture is never mid-animation.
  reducedMotion: 'reduce',
});

// Seeded before any app code runs, so the app's own onMount reads these
// instead of racing a later page.evaluate.
await page.addInitScript(
  ({ opens, introSeenMap }) => {
    for (const [name, open] of opens) localStorage.setItem(`onboarding-map:${name}-open`, String(open));
    if (introSeenMap) localStorage.setItem(`onboarding-map:${introSeenMap}:intro-seen`, 'true');
  },
  { opens, introSeenMap },
);

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(`${url}${hash}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);

// A prior click leaves a focus ring; clear it and move the pointer off-canvas
// so neither shows up in the capture.
await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
await page.mouse.move(0, 0);

await page.screenshot({ path: outFile });
await browser.close();

if (errors.length) {
  console.log(`! ${outFile} ERRORS: ${errors.slice(0, 2).join(' | ')}`);
  process.exitCode = 1;
} else {
  console.log(`saved ${outFile}`);
}
