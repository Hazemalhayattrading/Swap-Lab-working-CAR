/**
 * npm run validate-data
 *
 * Zod-checks every JSON file under src/data/ against its schema. Also checks that:
 * - every file in public/ (all of it ships) and every bundled asset file in src/
 *   is listed in src/data/assets.json with a source and licence;
 * - listed files exist, sit in the right folder for their kind, and are within budget;
 * - asset-bearing npm packages (fonts) are listed at their installed version;
 * - nothing anywhere in public/ is over GitHub's 100 MB limit.
 * Exits 1 on any issue.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { SOURCE_ASSET_PATTERN, validateData, type DataFile } from '../src/data/validate';
import { MAX_FILE_BYTES, formatBytes } from '../src/data/policy';

const root = process.cwd();
const toRepoPath = (abs: string) => relative(root, abs).split(sep).join('/');

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const abs = join(dir, name);
    return statSync(abs).isDirectory() ? walk(abs) : [abs];
  });
}

function sizeOf(path: string): number | undefined {
  try {
    return statSync(join(root, path)).size;
  } catch {
    return undefined;
  }
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const directDependencies = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

function dependencyVersion(name: string): string | undefined {
  if (!directDependencies.includes(name)) return undefined;
  try {
    const installed = JSON.parse(
      readFileSync(join(root, 'node_modules', ...name.split('/'), 'package.json'), 'utf8'),
    ) as { name?: string; version?: string };
    return installed.name === name ? installed.version : undefined;
  } catch {
    return undefined;
  }
}

const dataFiles: DataFile[] = [];
const parseErrors: string[] = [];
for (const abs of walk(join(root, 'src', 'data')).filter((f) => f.endsWith('.json'))) {
  const path = toRepoPath(abs);
  try {
    dataFiles.push({ path, json: JSON.parse(readFileSync(abs, 'utf8')) as unknown });
  } catch (err) {
    parseErrors.push(`${path}: not valid JSON (${(err as Error).message})`);
  }
}

const publicFiles = walk(join(root, 'public')).map(toRepoPath);
const oversized = publicFiles.filter((f) => (sizeOf(f) ?? 0) > MAX_FILE_BYTES);

const report = validateData(dataFiles, {
  sizeOf,
  dependencyVersion,
  dependencies: directDependencies,
  publicFiles,
  sourceAssetFiles: walk(join(root, 'src'))
    .map(toRepoPath)
    .filter((f) => SOURCE_ASSET_PATTERN.test(f)),
});

const problems = [
  ...parseErrors,
  ...oversized.map((f) => `${f}: ${formatBytes(sizeOf(f) ?? 0)} is over the 100 MB GitHub limit`),
  ...report.issues.map((i) => `${i.path}: ${i.message}`),
];

console.log(
  `Checked ${report.checkedFiles.length} data file(s): ${report.checkedFiles.join(', ') || 'none'}`,
);
for (const [key, n] of Object.entries(report.counts)) console.log(`  ${key}: ${n}`);
if (report.estimated.length > 0) {
  console.log('Values marked estimated:');
  for (const path of report.estimated) console.log(`  ${path}`);
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('All data files valid.');
