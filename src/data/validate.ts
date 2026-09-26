import type { z } from 'zod';
import { AssetManifestSchema, type Asset, type AssetManifest } from './schema/asset';
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
];

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
  const checkedFiles: string[] = [];

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
    if (rule.schema === AssetManifestSchema) {
      const manifest = result.data as AssetManifest;
      issues.push(...checkManifest(manifest, file.path, facts));
      for (const asset of manifest.assets) {
        const key = `asset status ${asset.status}`;
        counts[key] = (counts[key] ?? 0) + 1;
        if (asset.originConfidence) {
          const originKey = `asset origin ${asset.originConfidence}`;
          counts[originKey] = (counts[originKey] ?? 0) + 1;
        }
      }
    }
  }
  return { issues, checkedFiles, counts };
}
