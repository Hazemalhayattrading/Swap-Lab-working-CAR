import type { z } from 'zod';
import { AssetManifestSchema, type Asset, type AssetManifest } from './schema/asset';
import { CarSchema, type Car } from './schema/car';
import { EngineSchema, type Engine } from './schema/engine';
import { SwapSchema, type Swap } from './schema/swap';
import { KnownBuildsFileSchema, type KnownBuildsFile } from './schema/build';
import { AssumptionsFileSchema } from './schema/model';
import {
  DynosFileSchema,
  FuelsFileSchema,
  LocationsFileSchema,
  PowerRatingsFileSchema,
  WeightBasesFileSchema,
  type FuelsFile,
  type PowerRatingsFile,
} from './schema/standards';
import { BUDGET_BYTES, checkBudget } from './policy';

/**
 * Pure validation of every data file. The CLI wrapper (scripts/validate-data.ts)
 * reads the files from disk; this module only sees parsed JSON, so it is easy to test.
 */

export interface DataFile {
  /** Repo-relative path, forward slashes, e.g. `src/data/assets.json`. */
  path: string;
  json: unknown;
}

export interface FileFacts {
  /** Size in bytes of a repo-relative file, or undefined if it does not exist. */
  sizeOf(path: string): number | undefined;
  /** Installed version of a direct dependency from package.json, or undefined if it isn't one. */
  dependencyVersion(name: string): string | undefined;
  /** Names of every direct dependency in package.json. */
  dependencies: readonly string[];
  /** Every file under public/ (repo-relative). All of them ship to the site. */
  publicFiles: readonly string[];
  /** Every non-code file under src/ that Vite could bundle (images, fonts, models, audio). */
  sourceAssetFiles: readonly string[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  checkedFiles: string[];
  counts: Record<string, number>;
  /** JSON paths of every value marked `estimated` in car, engine and swap files. */
  estimated: string[];
  /**
   * Files of assets with a NoAI clause. Scripts may process them; no AI model
   * may be shown them, their textures or screenshots of them (CLAUDE.md rule 5).
   */
  noAiFiles: string[];
}

interface SchemaRule {
  description: string;
  test(path: string): boolean;
  schema: z.ZodType;
}

/**
 * Which schema validates which data file. A JSON file under src/data/ that no
 * rule claims is an error, so nothing ships unvalidated. Phase 1 adds cars,
 * engines and parts here.
 */
export const SCHEMA_RULES: readonly SchemaRule[] = [
  {
    description: 'third-party asset manifest',
    test: (p) => p === 'src/data/assets.json',
    schema: AssetManifestSchema,
  },
  {
    description: 'car (chassis and trims)',
    test: (p) => /^src\/data\/cars\/[a-z0-9-]+\.json$/.test(p),
    schema: CarSchema,
  },
  {
    description: 'engine',
    test: (p) => /^src\/data\/engines\/[a-z0-9-]+\.json$/.test(p),
    schema: EngineSchema,
  },
  {
    description: 'engine swap hardware (car x engine family)',
    test: (p) => /^src\/data\/swaps\/[a-z0-9-]+\.json$/.test(p),
    schema: SwapSchema,
  },
  {
    description: 'power rating standards (reference conditions)',
    test: (p) => p === 'src/data/standards/power-ratings.json',
    schema: PowerRatingsFileSchema,
  },
  {
    description: 'rating and pump fuels',
    test: (p) => p === 'src/data/standards/fuels.json',
    schema: FuelsFileSchema,
  },
  {
    description: 'curb-weight bases',
    test: (p) => p === 'src/data/standards/weight-bases.json',
    schema: WeightBasesFileSchema,
  },
  {
    description: 'altitude presets and the standard atmosphere',
    test: (p) => p === 'src/data/standards/locations.json',
    schema: LocationsFileSchema,
  },
  {
    description: 'chassis dynos and their correction standards',
    test: (p) => p === 'src/data/standards/dynos.json',
    schema: DynosFileSchema,
  },
  {
    description: 'known real builds with dyno results (one file per car)',
    test: (p) => /^src\/data\/builds\/[a-z0-9-]+\.json$/.test(p),
    schema: KnownBuildsFileSchema,
  },
  {
    description: 'simulation model assumptions',
    test: (p) => p === 'src/data/model/assumptions.json',
    schema: AssumptionsFileSchema,
  },
];

/** `src/data/cars/nissan-silvia-s15.json` -> `nissan-silvia-s15`. */
function fileStem(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
}

/**
 * Walks a parsed data file and counts every sourced value by confidence, and
 * lists where the `estimated` ones are, so the session summary can report them.
 */
export function collectConfidence(
  json: unknown,
  path: string,
  out: { counts: Record<string, number>; estimated: string[] },
): void {
  if (Array.isArray(json)) {
    json.forEach((item, i) => {
      collectConfidence(item, `${path}[${String(i)}]`, out);
    });
    return;
  }
  if (json === null || typeof json !== 'object') return;
  const record = json as Record<string, unknown>;
  if (typeof record.confidence === 'string' && Array.isArray(record.sources)) {
    const key = `value ${record.confidence}`;
    out.counts[key] = (out.counts[key] ?? 0) + 1;
    if (record.confidence === 'estimated') out.estimated.push(path);
    return;
  }
  for (const [key, value] of Object.entries(record))
    collectConfidence(value, `${path}.${key}`, out);
}

/**
 * Checks between files: ids match file names, trims point at real engine
 * variants, and swaps point at a real car and at launch-swap engines.
 */
function checkReferences(
  cars: readonly { path: string; car: Car }[],
  engines: readonly { path: string; engine: Engine }[],
  swaps: readonly { path: string; swap: Swap }[] = [],
  ratings?: { path: string; file: PowerRatingsFile },
  fuels?: { path: string; file: FuelsFile },
  builds: readonly { path: string; file: KnownBuildsFile }[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  // Known builds: one file per car, named for it, on real trims and real fuels.
  for (const { path, file } of builds) {
    const car = cars.find((c) => c.car.id === file.car)?.car;
    if (file.car !== fileStem(path)) {
      issues.push({ path, message: `car "${file.car}" must match the file name.` });
    }
    if (!car) {
      issues.push({ path: `${path}.car`, message: `No car file for "${file.car}".` });
      continue;
    }
    file.builds.forEach((b, i) => {
      if (!car.trims.some((t) => t.id === b.trim)) {
        issues.push({
          path: `${path}.builds[${String(i)}].trim`,
          message: `Car "${car.id}" has no trim "${b.trim}".`,
        });
      }
      const fuelId = b.modifications.fuel.fuelId;
      if (fuelId && fuels && !fuels.file.fuels.some((f) => f.id === fuelId)) {
        issues.push({
          path: `${path}.builds[${String(i)}].modifications.fuel.fuelId`,
          message: `No fuel "${fuelId}" in ${fuels.path}.`,
        });
      }
    });
  }
  // Every factory rating must be comparable under its own standard: the
  // standard has reference conditions (or, if unlabelled, a rule for its
  // market), and its market has a rating fuel.
  for (const { path, engine } of engines) {
    engine.variants.forEach((v, i) => {
      const market = v.markets[0] ?? 'other';
      const at = `${path}.variants[${String(i)}].output.standard`;
      const standard = v.output.standard;
      if (ratings && standard === 'unknown') {
        const start = v.period.value.from;
        const within = (a: string, b: string) =>
          a
            .slice(0, Math.min(a.length, b.length))
            .localeCompare(b.slice(0, Math.min(a.length, b.length)));
        const rule = ratings.file.unknownStandard.find(
          (u) =>
            u.markets.includes(market) &&
            (u.from === undefined || within(start, u.from) >= 0) &&
            (u.to === undefined || within(start, u.to) <= 0),
        );
        if (!rule) {
          issues.push({
            path: at,
            message: `No assumed standard for unlabelled ${market} figures (${ratings.path}).`,
          });
        }
      } else if (ratings && !ratings.file.standards.some((s) => s.id === standard)) {
        issues.push({
          path: at,
          message: `No reference conditions for "${standard}" (${ratings.path}).`,
        });
      }
      if (fuels && !fuels.file.referenceFuels.some((f) => f.market === market)) {
        issues.push({ path: at, message: `No rating fuel for ${market} (${fuels.path}).` });
      }
    });
  }
  const byId = new Map<string, Engine>();
  for (const { path, engine } of engines) {
    if (engine.id !== fileStem(path)) {
      issues.push({ path, message: `id "${engine.id}" must match the file name.` });
    }
    byId.set(engine.id, engine);
  }
  for (const { path, car } of cars) {
    if (car.id !== fileStem(path)) {
      issues.push({ path, message: `id "${car.id}" must match the file name.` });
    }
    car.trims.forEach((trim, i) => {
      const engine = byId.get(trim.engine.id);
      const at = `${path}.trims[${String(i)}].engine`;
      if (!engine) {
        issues.push({ path: at, message: `No engine file for "${trim.engine.id}".` });
      } else if (!engine.variants.some((v) => v.id === trim.engine.variant)) {
        issues.push({
          path: at,
          message: `Engine "${engine.id}" has no variant "${trim.engine.variant}".`,
        });
      }
    });
  }
  for (const { path, swap } of swaps) {
    if (swap.id !== fileStem(path)) {
      issues.push({ path, message: `id "${swap.id}" must match the file name.` });
    }
    const car = cars.find((c) => c.car.id === swap.car)?.car;
    if (!car) {
      issues.push({ path: `${path}.car`, message: `No car file for "${swap.car}".` });
    }
    swap.parts.forEach((part, i) => {
      part.carGearbox?.forEach((id, j) => {
        if (car && !car.transmissions.some((t) => t.id === id)) {
          issues.push({
            path: `${path}.parts[${String(i)}].carGearbox[${String(j)}]`,
            message: `Car "${car.id}" has no transmission "${id}".`,
          });
        }
      });
    });
    swap.engines.forEach((id, i) => {
      const engine = byId.get(id);
      const at = `${path}.engines[${String(i)}]`;
      if (!engine) {
        issues.push({ path: at, message: `No engine file for "${id}".` });
      } else if (engine.role !== 'launch-swap') {
        issues.push({
          path: at,
          message: `"${id}" is a stock-only engine; swaps are for launch-swap engines.`,
        });
      }
    });
  }
  return issues;
}

/**
 * First-party files allowed in public/ without a manifest entry. Everything else
 * in public/ is copied to the live site, so it must be listed with a licence.
 */
export const FIRST_PARTY_PUBLIC_FILES: readonly string[] = [];

/** Files under src/ that Vite would emit as assets rather than compile as code. */
export const SOURCE_ASSET_PATTERN =
  /\.(glb|gltf|bin|hdr|exr|ktx2?|basis|jpe?g|png|webp|avif|gif|svg|ico|woff2?|ttf|otf|mp3|ogg|wav|flac|mp4|webm|fbx|obj|usdz|drc)$/i;

/** npm packages that ship fonts, images or models into the bundle; each needs a manifest entry. */
export const ASSET_PACKAGE_PATTERN = /^(@fontsource\/|@pmndrs\/assets$)/;

/** public/models/<folder>/ decides what kind an asset is, and so its size budget. */
const PATH_KIND: readonly [RegExp, Asset['kind']][] = [
  [/^public\/models\/cars\//, 'model-car'],
  [/^public\/models\/engines\//, 'model-engine'],
  [/^public\/models\/parts\//, 'model-part'],
  [/^public\/models\/props\//, 'model-prop'],
];

function formatZodPath(path: readonly PropertyKey[]): string {
  return path.map((p) => (typeof p === 'number' ? `[${p}]` : `.${String(p)}`)).join('');
}

/** Splits `npm:@scope/name@1.2.3` into name and version. */
export function parseNpmSpec(spec: string): { name: string; version: string } | undefined {
  const m = /^npm:((?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*)@(\d+\.\d+\.\d+[\w.+-]*)$/i.exec(spec);
  return m?.[1] && m[2] ? { name: m[1], version: m[2] } : undefined;
}

function checkManifest(manifest: AssetManifest, file: string, facts: FileFacts): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const listedFiles = new Set<string>();
  const listedPackages = new Set<string>();

  for (const asset of manifest.assets) {
    let assetBytes = 0;
    for (const f of asset.files) {
      if (f.startsWith('npm:')) {
        const spec = parseNpmSpec(f);
        if (!spec) {
          issues.push({
            path: file,
            message: `${asset.id}: "${f}" is not a valid npm:name@x.y.z spec.`,
          });
          continue;
        }
        listedPackages.add(spec.name);
        const installed = facts.dependencyVersion(spec.name);
        if (installed === undefined) {
          issues.push({
            path: file,
            message: `${asset.id}: ${spec.name} is not a direct dependency in package.json.`,
          });
        } else if (installed !== spec.version) {
          issues.push({
            path: file,
            message: `${asset.id}: manifest says ${spec.name}@${spec.version} but ${installed} is installed. Update the manifest after checking the licence of the new version.`,
          });
        }
        continue;
      }

      listedFiles.add(f);
      if (!f.startsWith('public/') && !f.startsWith('src/')) {
        issues.push({ path: file, message: `${asset.id}: ${f} must be under public/ or src/.` });
      }
      const pathKind = PATH_KIND.find(([re]) => re.test(f))?.[1];
      if (pathKind && pathKind !== asset.kind) {
        issues.push({
          path: file,
          message: `${asset.id}: ${f} lives in the ${pathKind} folder but the asset says kind "${asset.kind}".`,
        });
      }
      const size = facts.sizeOf(f);
      if (size === undefined) {
        issues.push({ path: file, message: `${asset.id}: file ${f} does not exist.` });
        continue;
      }
      assetBytes += size;
      const budget = checkBudget(asset.kind, size);
      if (!budget.ok)
        issues.push({ path: file, message: `${asset.id}: ${f} is ${budget.message}.` });
    }

    // Cars and engines are budgeted as a whole download (a .gltf + .bin + textures counts once).
    if (asset.kind in BUDGET_BYTES && asset.files.length > 1) {
      const total = checkBudget(asset.kind, assetBytes);
      if (!total.ok)
        issues.push({
          path: file,
          message: `${asset.id}: all files together are ${total.message}.`,
        });
    }
  }

  const allowed = new Set(FIRST_PARTY_PUBLIC_FILES);
  for (const f of [...facts.publicFiles, ...facts.sourceAssetFiles]) {
    if (!listedFiles.has(f) && !allowed.has(f)) {
      issues.push({
        path: f,
        message:
          'Shipped file is not listed in src/data/assets.json. Every third-party file needs a source and licence.',
      });
    }
  }
  for (const name of facts.dependencies) {
    if (ASSET_PACKAGE_PATTERN.test(name) && !listedPackages.has(name)) {
      issues.push({
        path: 'package.json',
        message: `${name} ships assets (fonts, images or models) but has no entry in src/data/assets.json.`,
      });
    }
  }
  return issues;
}

export function validateData(files: readonly DataFile[], facts: FileFacts): ValidationReport {
  const issues: ValidationIssue[] = [];
  const counts: Record<string, number> = {};
  const estimated: string[] = [];
  const noAiFiles: string[] = [];
  const checkedFiles: string[] = [];
  const cars: { path: string; car: Car }[] = [];
  const engines: { path: string; engine: Engine }[] = [];
  const swaps: { path: string; swap: Swap }[] = [];
  let ratings: { path: string; file: PowerRatingsFile } | undefined;
  let fuels: { path: string; file: FuelsFile } | undefined;
  const builds: { path: string; file: KnownBuildsFile }[] = [];

  for (const file of files) {
    const rule = SCHEMA_RULES.find((r) => r.test(file.path));
    if (!rule) {
      issues.push({
        path: file.path,
        message:
          'No schema is registered for this data file (add one to SCHEMA_RULES in src/data/validate.ts).',
      });
      continue;
    }
    checkedFiles.push(file.path);
    const result = rule.schema.safeParse(file.json);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({ path: `${file.path}${formatZodPath(issue.path)}`, message: issue.message });
      }
      continue;
    }
    if (rule.schema === CarSchema) cars.push({ path: file.path, car: result.data as Car });
    if (rule.schema === EngineSchema) {
      engines.push({ path: file.path, engine: result.data as Engine });
    }
    if (rule.schema === SwapSchema) swaps.push({ path: file.path, swap: result.data as Swap });
    if (rule.schema === PowerRatingsFileSchema) {
      ratings = { path: file.path, file: result.data as PowerRatingsFile };
    }
    if (rule.schema === FuelsFileSchema)
      fuels = { path: file.path, file: result.data as FuelsFile };
    if (rule.schema === KnownBuildsFileSchema) {
      builds.push({ path: file.path, file: result.data as KnownBuildsFile });
    }
    if (rule.schema !== AssetManifestSchema) {
      collectConfidence(result.data, file.path, { counts, estimated });
    }
    if (rule.schema === AssetManifestSchema) {
      const manifest = result.data as AssetManifest;
      issues.push(...checkManifest(manifest, file.path, facts));
      for (const asset of manifest.assets) {
        const key = `asset status ${asset.status}`;
        counts[key] = (counts[key] ?? 0) + 1;
        if (asset.restrictions.noAi) {
          counts['asset with NoAI clause'] = (counts['asset with NoAI clause'] ?? 0) + 1;
          noAiFiles.push(...asset.files);
        }
        if (asset.originConfidence) {
          const originKey = `asset origin ${asset.originConfidence}`;
          counts[originKey] = (counts[originKey] ?? 0) + 1;
        }
      }
    }
  }
  issues.push(...checkReferences(cars, engines, swaps, ratings, fuels, builds));
  return { issues, checkedFiles, counts, estimated, noAiFiles };
}
