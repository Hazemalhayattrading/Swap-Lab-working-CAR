/**
 * npm run budget (after npm run build)
 *
 * The performance budget CI enforces on the production build in dist/: what a
 * first visit downloads, by kind, against perf-budget.json. Text files count
 * at their gzip size (GitHub Pages serves them gzipped); binaries count as
 * they are. Source maps and the .woff fallbacks (browsers that can use
 * .woff2 never fetch them) aren't downloaded, so they don't count.
 * Exits 1 when anything is over budget.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

interface Budget {
  transferBytes: Record<Category | 'initialDownload', number>;
}

type Category =
  'html' | 'appJs' | 'threeJs' | 'workerJs' | 'css' | 'fonts' | 'environment' | 'other';

const root = process.cwd();
const dist = join(root, 'dist');
const budget = JSON.parse(readFileSync(join(root, 'perf-budget.json'), 'utf8')) as Budget;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const abs = join(dir, name);
    return statSync(abs).isDirectory() ? walk(abs) : [abs];
  });
}

const TEXT = /\.(html|js|mjs|css|json|svg|txt)$/i;
const NOT_DOWNLOADED = /(\.map$|\.woff$|^\.vite\/)/i;

function categorise(path: string): Category {
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.woff2')) return 'fonts';
  if (path.startsWith('env/')) return 'environment';
  if (path.endsWith('.js')) {
    const name = path.slice(path.lastIndexOf('/') + 1);
    if (name.startsWith('three-')) return 'threeJs';
    if (name.includes('worker')) return 'workerJs';
    return 'appJs';
  }
  return 'other';
}

let files: string[];
try {
  files = walk(dist);
} catch {
  console.error('No dist/ folder: run `npm run build` first.');
  process.exit(1);
}

const totals: Record<Category, number> = {
  html: 0,
  appJs: 0,
  threeJs: 0,
  workerJs: 0,
  css: 0,
  fonts: 0,
  environment: 0,
  other: 0,
};
const rows: { path: string; category: Category; bytes: number; transfer: number }[] = [];
for (const abs of files) {
  const path = relative(dist, abs).split(sep).join('/');
  if (NOT_DOWNLOADED.test(path)) continue;
  const content = readFileSync(abs);
  const transfer = TEXT.test(path)
    ? gzipSync(content, { level: 9 }).byteLength
    : content.byteLength;
  const category = categorise(path);
  totals[category] += transfer;
  rows.push({ path, category, bytes: content.byteLength, transfer });
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
console.log('Downloaded on a first visit (gzip for text):');
for (const r of rows.sort((a, b) => b.transfer - a.transfer)) {
  console.log(`  ${r.path.padEnd(58)} ${kb(r.transfer).padStart(10)}  (${r.category})`);
}

const problems: string[] = [];
const check = (name: Category | 'initialDownload', value: number) => {
  const limit = budget.transferBytes[name];
  const share = limit > 0 ? value / limit : value > 0 ? Infinity : 0;
  const status = value <= limit ? 'ok  ' : 'OVER';
  console.log(
    `${status} ${name.padEnd(16)} ${kb(value).padStart(10)} of ${kb(limit).padStart(10)} (${(share * 100).toFixed(0)} %)`,
  );
  if (value > limit) problems.push(`${name} is ${kb(value)}, over its ${kb(limit)} budget.`);
};
console.log('\nBudget (perf-budget.json):');
for (const name of Object.keys(totals) as Category[]) check(name, totals[name]);
check(
  'initialDownload',
  Object.values(totals).reduce((s, x) => s + x, 0),
);

if (problems.length > 0) {
  console.error(`\n${String(problems.length)} over budget:`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    'Shrink the download, or raise the budget in perf-budget.json with a reason in docs/decisions.md.',
  );
  process.exit(1);
}
console.log('\nWithin budget.');
