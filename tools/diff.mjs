/**
 * Pixel-diffs each new/old screenshot pair and writes a highlight image.
 *   node tools/diff.mjs <dir>
 */
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dir = process.argv[2];
const variants = readdirSync(dir)
  .filter((f) => f.startsWith('new-') && f.endsWith('.png'))
  .map((f) => f.slice(4, -4));

let worst = 0;
for (const v of variants) {
  const a = PNG.sync.read(readFileSync(`${dir}/new-${v}.png`));
  const b = PNG.sync.read(readFileSync(`${dir}/old-${v}.png`));
  if (a.width !== b.width || a.height !== b.height) {
    console.log(`${v.padEnd(14)} SIZE MISMATCH ${a.width}x${a.height} vs ${b.width}x${b.height}`);
    continue;
  }
  const out = new PNG({ width: a.width, height: a.height });
  const changed = pixelmatch(a.data, b.data, out.data, a.width, a.height, {
    threshold: 0.12,
    includeAA: false,
  });
  const pct = (changed / (a.width * a.height)) * 100;
  worst = Math.max(worst, pct);
  writeFileSync(`${dir}/diff-${v}.png`, PNG.sync.write(out));
  console.log(`${v.padEnd(14)} ${String(changed).padStart(8)} px  ${pct.toFixed(3)}%  -> diff-${v}.png`);
}
console.log(`\nworst variant: ${worst.toFixed(3)}%`);
