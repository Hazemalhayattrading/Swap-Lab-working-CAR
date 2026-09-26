import { describe, expect, it } from 'vitest';
import { BUDGET_BYTES, MAX_FILE_BYTES, checkBudget, formatBytes } from '../../src/data/policy';

const MB = 1024 * 1024;

describe('asset budgets', () => {
  it('matches CLAUDE.md rule 7', () => {
    expect(BUDGET_BYTES['model-car']).toBe(25 * MB);
    expect(BUDGET_BYTES['model-engine']).toBe(8 * MB);
    expect(MAX_FILE_BYTES).toBe(100 * MB);
  });

  it('allows a car GLB at exactly 25 MB and rejects one byte more', () => {
    expect(checkBudget('model-car', 25 * MB).ok).toBe(true);
    expect(checkBudget('model-car', 25 * MB + 1).ok).toBe(false);
  });

  it('applies the engine budget', () => {
    expect(checkBudget('model-engine', 8 * MB).ok).toBe(true);
    expect(checkBudget('model-engine', 8 * MB + 1).ok).toBe(false);
  });

  it('falls back to the 100 MB GitHub limit for other kinds', () => {
    const result = checkBudget('hdri', 101 * MB);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/100 MB GitHub limit/);
    expect(checkBudget('model-part', 40 * MB).ok).toBe(true);
  });

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 kB');
    expect(formatBytes(3 * MB)).toBe('3.00 MB');
  });
});
