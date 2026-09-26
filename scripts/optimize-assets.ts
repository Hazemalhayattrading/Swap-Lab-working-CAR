/**
 * npm run assets
 *
 * assets-raw/<cars|engines|parts|props>/**\/*.{glb,gltf}  ->  public/models/<same path>.glb
 *
 * assets-raw/ is git-ignored (CLAUDE.md rule 7): raw purchases and downloads stay
 * local. Every optimised file must also be added to src/data/assets.json with its
 * source and licence, or `npm run validate-data` fails.
 *
 * Exits 1 if any output is over budget (car 25 MB, engine 8 MB, any file 100 MB),
 * or if two inputs would write the same output file.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { RAW_FOLDER_KIND, formatBytes, type RawFolder } from '../src/data/policy';
import { createIO, findOutputCollisions, optimizeToGlb } from './lib/optimize';

const root = process.cwd();
const rawDir = join(root, 'assets-raw');
const outDir = join(root, 'public', 'models');

function walk(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.flatMap((name) => {
    const abs = join(dir, name);
    return statSync(abs).isDirectory() ? walk(abs) : [abs];
  });
}

const inputs = walk(rawDir).filter((f) => ['.glb', '.gltf'].includes(extname(f).toLowerCase()));
if (inputs.length === 0) {
  console.log(
    'No raw models in assets-raw/. Put files in assets-raw/cars, engines, parts or props, then run this again.',
  );
  process.exit(0);
}

const jobs = inputs.map((input) => {
  const rel = relative(rawDir, input);
  return { input, rel, output: join(outDir, rel.slice(0, -extname(rel).length) + '.glb') };
});

const collisions = findOutputCollisions(jobs.map((j) => ({ input: j.rel, output: j.output })));
if (collisions.length > 0) {
  for (const group of collisions) {
    console.error(
      `These inputs would overwrite the same output: ${group.join(', ')}. Rename or remove one.`,
    );
  }
  process.exit(1);
}

const io = await createIO();
let failures = 0;

for (const { input, rel, output } of jobs) {
  const folder = rel.split(sep)[0] as RawFolder;
  const kind = RAW_FOLDER_KIND[folder] as string | undefined;
  if (!kind) {
    console.error(`skip ${rel}: put it under one of ${Object.keys(RAW_FOLDER_KIND).join(', ')}`);
    failures++;
    continue;
  }
  try {
    const inputBytes = statSync(input).size;
    // .gltf with external buffers and textures is read from disk; .glb from bytes.
    const doc =
      extname(input).toLowerCase() === '.gltf'
        ? await io.read(input)
        : await io.readBinary(new Uint8Array(readFileSync(input)));
    const result = await optimizeToGlb(io, doc, kind);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, result.bytes);
    const tris = `${result.before.triangles.toLocaleString('en')} tris`;
    console.log(
      `${result.budget.ok ? 'ok  ' : 'OVER'} ${rel} -> ${relative(root, output)}: ${formatBytes(inputBytes)} -> ${result.budget.message}, ${tris}, ${result.after.textures} textures (${formatBytes(result.after.textureBytes)})`,
    );
    if (!result.budget.ok) failures++;
  } catch (error) {
    console.error(`fail ${rel}: ${(error as Error).message}`);
    failures++;
  }
}

console.log('\nTextures are not recompressed yet: KTX2 (Basis) lands with the Phase 4 pipeline.');
if (failures > 0) {
  console.error(`${failures} file(s) failed or are over budget.`);
  process.exit(1);
}
