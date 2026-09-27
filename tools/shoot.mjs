/**
 * Visual regression harness.
 *
 * Renders a built site and a baseline build in the same headless browser and
 * screenshots each, so differences in host font rendering cannot skew the
 * comparison. Serve both (e.g. `onboarding-map build` + any static server).
 *
 *   node tools/shoot.mjs <url> <outDir> [--baseline <url>] [--states]
 *   node tools/diff.mjs <outDir>
 *
 * --states also drives interactions a first-paint screenshot cannot see. Its
 * selectors date from before the SvelteKit migration and no longer match the
 * page; update them before relying on it.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [url, outDir] = process.argv.slice(2);
const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const baseline = arg('--baseline');
const withStates = process.argv.includes('--states');

const VIEWPORTS = [
  { name: 'wide', width: 1600, height: 900 },
  { name: 'mid', width: 1200, height: 800 },
  { name: 'narrow', width: 800, height: 900 },
];

/** Each state leaves the page in a distinct visual configuration. */
const STATES = {
  default: async () => {},
  stage5: async (page) => {
    await page.locator('.stage-btn').nth(4).click();
    await page.waitForTimeout(500);
  },
  node: async (page) => {
    // A path item, so the panel shows status, connections and module links.
    await page.locator('.leaf.path').nth(3).click();
    await page.waitForTimeout(400);
  },
  module: async (page) => {
    await page.locator('.bp-box').nth(2).click();
    await page.waitForTimeout(400);
  },
  everything: async (page) => {
    await page.locator('.view-switch button').nth(1).click();
    await page.waitForTimeout(900);
  },
  revealed: async (page) => {
    await page.locator('.toggle, #reveal').first().click();
    await page.waitForTimeout(500);
  },
  hover: async (page) => {
    await page.locator('.leaf.path').nth(3).hover();
    await page.waitForTimeout(400);
  },
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
let failures = 0;

async function shoot(target, label) {
  for (const vp of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      // Interaction states are only worth capturing once, at the widest layout;
      // the responsive work is covered by the default state at every width.
      const states = withStates && vp.name === 'wide' ? Object.keys(STATES) : ['default'];

      for (const state of states) {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
          deviceScaleFactor: 2,
          // The stylesheet honours this by stopping the route flow and the
          // waypoint pulse, so captures are never compared mid-animation.
          reducedMotion: 'reduce',
        });
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

        await page.goto(target, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000);

        try {
          await STATES[state](page);
        } catch (e) {
          console.log(`  ! ${label}-${vp.name}-${theme}-${state}: ${String(e).split('\n')[0]}`);
          failures++;
        }

        const suffix = state === 'default' ? '' : `-${state}`;
        await page.screenshot({ path: `${outDir}/${label}-${vp.name}-${theme}${suffix}.png` });
        if (errors.length) {
          console.log(`  ! ${label}-${vp.name}-${theme}${suffix} ERRORS: ${errors.slice(0, 2).join(' | ')}`);
          failures++;
        }
        await page.close();
      }
    }
  }
}

await shoot(url, 'new');
if (baseline) await shoot(baseline, 'old');
await browser.close();
console.log(failures ? `\n${failures} problem(s)` : '\nall states captured cleanly');
