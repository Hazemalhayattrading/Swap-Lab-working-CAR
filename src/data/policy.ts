/**
 * Asset size budgets (CLAUDE.md rule 7, BUILD_PROMPT.md section 4).
 * Pure constants and checks, shared by the asset pipeline, validate-data and tests.
 */

const MB = 1024 * 1024;

/** GitHub rejects any single file over 100 MB. */
export const MAX_FILE_BYTES = 100 * MB;

export const BUDGET_BYTES = {
  'model-car': 25 * MB,
  'model-engine': 8 * MB,
} as const;

export type BudgetedKind = keyof typeof BUDGET_BYTES;

export interface BudgetResult {
  ok: boolean;
  limitBytes: number;
  message: string;
}

export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${bytes} B`;
}

/** Checks a file against its kind's budget and against the hard 100 MB limit. */
export function checkBudget(kind: string, bytes: number): BudgetResult {
  const kindLimit = kind in BUDGET_BYTES ? BUDGET_BYTES[kind as BudgetedKind] : undefined;
  const limitBytes = Math.min(kindLimit ?? MAX_FILE_BYTES, MAX_FILE_BYTES);
  const ok = bytes <= limitBytes;
  const scope = kindLimit === undefined ? 'the 100 MB GitHub limit' : `the ${kind} budget`;
  return {
    ok,
    limitBytes,
    message: `${formatBytes(bytes)} ${ok ? 'within' : 'over'} ${scope} of ${formatBytes(limitBytes)}`,
  };
}

/** Maps an assets-raw/ sub-folder to the asset kind it holds. */
export const RAW_FOLDER_KIND = {
  cars: 'model-car',
  engines: 'model-engine',
  parts: 'model-part',
  props: 'model-prop',
} as const;
export type RawFolder = keyof typeof RAW_FOLDER_KIND;
