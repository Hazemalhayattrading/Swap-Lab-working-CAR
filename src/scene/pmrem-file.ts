/**
 * The baked environment file (scripts/bake-environment.ts writes it,
 * environment.ts reads it): a prefiltered PMREM atlas in three's cube-UV
 * layout, one RGB9E5 texel per 32-bit word, behind a 24-byte header, gzipped.
 *
 * RGB9E5 is the shared-exponent HDR format of EXT_texture_shared_exponent:
 * three 9-bit mantissas and one 5-bit exponent (bias 15). It holds values up to
 * 65,408, is filterable on WebGPU ('rgb9e5ufloat') and WebGL 2 (RGB9_E5), and
 * takes 4 bytes a texel against 8 for half float. Pure, so it can be tested.
 */

export const PMREM_MAGIC = 0x4d50_4c53; // "SLPM", little-endian
export const PMREM_VERSION = 1;
const HEADER_WORDS = 6;

const MANTISSA_BITS = 9;
const EXPONENT_BIAS = 15;
const MAX_EXPONENT = 31;
const MANTISSA_VALUES = 1 << MANTISSA_BITS;
/** Largest representable value: (511 / 512) x 2^16. */
export const RGB9E5_MAX =
  ((MANTISSA_VALUES - 1) / MANTISSA_VALUES) * 2 ** (MAX_EXPONENT - EXPONENT_BIAS);

/** Packs linear RGB into RGB9E5 (the spec's rounding; negatives and NaN become 0). */
export function packRgb9e5(r: number, g: number, b: number): number {
  const clampChannel = (x: number) => (x > 0 ? Math.min(x, RGB9E5_MAX) : 0);
  const rc = clampChannel(r);
  const gc = clampChannel(g);
  const bc = clampChannel(b);
  const maxc = Math.max(rc, gc, bc);
  if (maxc === 0) return 0;
  let exponent = Math.max(-EXPONENT_BIAS - 1, Math.floor(Math.log2(maxc))) + 1 + EXPONENT_BIAS;
  let scale = 2 ** (exponent - EXPONENT_BIAS - MANTISSA_BITS);
  if (Math.floor(maxc / scale + 0.5) === MANTISSA_VALUES) {
    exponent += 1;
    scale *= 2;
  }
  const rs = Math.floor(rc / scale + 0.5);
  const gs = Math.floor(gc / scale + 0.5);
  const bs = Math.floor(bc / scale + 0.5);
  return (rs | (gs << 9) | (bs << 18) | (exponent << 27)) >>> 0;
}

export function unpackRgb9e5(word: number): [number, number, number] {
  const exponent = word >>> 27;
  const scale = 2 ** (exponent - EXPONENT_BIAS - MANTISSA_BITS);
  return [(word & 0x1ff) * scale, ((word >>> 9) & 0x1ff) * scale, ((word >>> 18) & 0x1ff) * scale];
}

export interface EnvironmentAtlas {
  width: number;
  height: number;
  /** RGB9E5 words, row by row from the first row the bake read back. */
  texels: Uint32Array;
}

export function encodeEnvironment(atlas: EnvironmentAtlas): Uint8Array {
  const words = new Uint32Array(HEADER_WORDS + atlas.texels.length);
  words.set([PMREM_MAGIC, PMREM_VERSION, atlas.width, atlas.height, atlas.texels.length, 0]);
  words.set(atlas.texels, HEADER_WORDS);
  return new Uint8Array(words.buffer);
}

/** Parses an (already decompressed) environment file. Throws on anything unexpected. */
export function decodeEnvironment(buffer: ArrayBuffer): EnvironmentAtlas {
  if (buffer.byteLength < HEADER_WORDS * 4 || buffer.byteLength % 4 !== 0) {
    throw new Error('Environment file is truncated.');
  }
  const words = new Uint32Array(buffer);
  const [magic, version, width = 0, height = 0, count = 0] = words;
  if (magic !== PMREM_MAGIC) throw new Error('Not a Swap Lab environment file.');
  if (version !== PMREM_VERSION)
    throw new Error(`Unsupported environment file version ${String(version)}.`);
  if (width * height !== count || words.length !== HEADER_WORDS + count) {
    throw new Error('Environment file size does not match its header.');
  }
  return { width, height, texels: words.slice(HEADER_WORDS) };
}

/** gzip streams start with 0x1f 0x8b. */
export function isGzip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}
