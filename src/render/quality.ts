/**
 * Render quality presets (BUILD_PROMPT.md section 8: Low / High / Ultra).
 * Targets: showroom >= 60 fps and cutaway >= 45 fps on mid-range hardware.
 */
export const QUALITY_LEVELS = ['low', 'high', 'ultra'] as const;
export type QualityLevel = (typeof QUALITY_LEVELS)[number];

export interface QualitySettings {
  /** Upper bound on devicePixelRatio. */
  maxPixelRatio: number;
  /** MSAA samples for the main scene pass. 0 turns it off. */
  msaaSamples: number;
  /** Shadow map edge in texels. 0 turns shadows off. */
  shadowMapSize: number;
  /** Bloom on emissive light fixtures. */
  bloom: boolean;
}

export const QUALITY: Record<QualityLevel, QualitySettings> = {
  low: { maxPixelRatio: 1, msaaSamples: 0, shadowMapSize: 0, bloom: false },
  high: { maxPixelRatio: 1.5, msaaSamples: 4, shadowMapSize: 1024, bloom: true },
  ultra: { maxPixelRatio: 2, msaaSamples: 4, shadowMapSize: 2048, bloom: true },
};

export const DEFAULT_QUALITY: QualityLevel = 'high';

export function isQualityLevel(value: unknown): value is QualityLevel {
  return typeof value === 'string' && (QUALITY_LEVELS as readonly string[]).includes(value);
}

/** URL `?quality=` wins over the stored preference, which wins over the default. */
export function resolveQuality(search: string, stored: string | null): QualityLevel {
  const fromUrl = new URLSearchParams(search).get('quality')?.toLowerCase();
  if (isQualityLevel(fromUrl)) return fromUrl;
  if (isQualityLevel(stored)) return stored;
  return DEFAULT_QUALITY;
}

export function pixelRatioFor(level: QualityLevel, devicePixelRatio: number): number {
  return Math.min(Math.max(devicePixelRatio, 1), QUALITY[level].maxPixelRatio);
}
