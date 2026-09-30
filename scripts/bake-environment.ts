/**
 * npm run bake-env
 *
 * Bakes the garage's image-based lighting offline, so visitors download a small,
 * already prefiltered environment instead of a 5.2 MB EXR that their browser has
 * to decode, grade and prefilter at start-up.
 *
 * 1. Reads Poly Haven's Autoshop 01 (2k EXR, CC0) from assets-raw/env/, downloading
 *    it from Poly Haven if it's missing, and checks its SHA-256 against the manifest.
 * 2. Applies the night grade (src/scene/night-grade.ts) and box-filters it down to
 *    4 x the cube size (PMREMGenerator sizes its cube from the equirect's width).
 * 3. Prefilters it with three's own PMREMGenerator in headless Chromium, so the
 *    atlas has exactly the layout three samples at run time.
 * 4. Packs the half-float atlas as RGB9E5 (shared-exponent HDR, 4 bytes a texel,
 *    filterable on WebGPU and WebGL 2) behind a small header, gzips it, and writes
 *    public/env/autoshop_01_night.pmrem. src/scene/environment.ts loads it.
 *
 * PMREMGenerator writes its render target with Y inverted and three flips the
 * lookup direction only for its own render targets, not for a texture it is
 * handed. So the equirect is flipped top to bottom before the bake; the
 * prefilter is symmetric under that flip, and the handed-over atlas then reads
 * the right way up on both backends (the e2e test compares it with a runtime bake).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';
import { DataUtils, FloatType } from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { applyNightGrade } from '../src/scene/night-grade';
import { PNG } from 'pngjs';
import { encodeEnvironment, packRgb9e5 } from '../src/scene/pmrem-file';

const root = process.cwd();
const SOURCE = join(root, 'assets-raw', 'env', 'autoshop_01_2k.exr');
const SOURCE_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/2k/autoshop_01_2k.exr';
const SOURCE_SHA256 = '93f15df7efeeb7e5913b07f15adcecc41b9adbd9f25ea2213e9d8e8adcf81c00';
const OUTPUT = join(root, 'public', 'env', 'autoshop_01_night.pmrem');
const CUBE_SIZE = Number(process.env.CUBE_SIZE ?? 128);
const ORIGIN = 'http://localhost:65531';

async function readSource(): Promise<Buffer> {
  if (!existsSync(SOURCE)) {
    console.log(`Downloading ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL);
    if (!response.ok) throw new Error(`Download failed: HTTP ${String(response.status)}`);
    mkdirSync(dirname(SOURCE), { recursive: true });
    writeFileSync(SOURCE, Buffer.from(await response.arrayBuffer()));
  }
  const bytes = readFileSync(SOURCE);
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (sha !== SOURCE_SHA256) throw new Error(`${SOURCE} has SHA-256 ${sha}, not ${SOURCE_SHA256}.`);
  return bytes;
}

/** Averages 2x2 blocks until the width is `width` (RGBA floats). */
function downsample(
  data: Float32Array,
  w: number,
  h: number,
  width: number,
): { data: Float32Array; w: number; h: number } {
  let src = data;
  let sw = w;
  let sh = h;
  while (sw > width) {
    const dw = sw / 2;
    const dh = sh / 2;
    const out = new Float32Array(dw * dh * 4);
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        for (let c = 0; c < 4; c++) {
          const at = (yy: number, xx: number) => src[(yy * sw + xx) * 4 + c] ?? 0;
          out[(y * dw + x) * 4 + c] =
            (at(2 * y, 2 * x) +
              at(2 * y, 2 * x + 1) +
              at(2 * y + 1, 2 * x) +
              at(2 * y + 1, 2 * x + 1)) /
            4;
        }
      }
    }
    src = out;
    sw = dw;
    sh = dh;
  }
  return { data: src, w: sw, h: sh };
}

/** Flips rows top to bottom (see the file comment). */
function flipRows(data: Float32Array, w: number, h: number): Float32Array {
  const out = new Float32Array(data.length);
  const row = w * 4;
  for (let y = 0; y < h; y++) out.set(data.subarray(y * row, (y + 1) * row), (h - 1 - y) * row);
  return out;
}

interface Bake {
  width: number;
  height: number;
  backend: string;
  packed: Uint32Array;
  checks: Check[];
}

interface Check {
  backend: string;
  width: number;
  height: number;
  reference: Float32Array;
  baked: Float32Array;
}

const halves = (body: Buffer): Float32Array => {
  const words = new Uint16Array(body.buffer, body.byteOffset, body.byteLength / 2);
  return Float32Array.from(words, (h) => DataUtils.fromHalfFloat(h));
};

/** Packs RGBA floats (alpha ignored) into RGB9E5 words. */
function pack(rgba: Float32Array): Uint32Array {
  const out = new Uint32Array(rgba.length / 4);
  for (let i = 0; i < out.length; i++) {
    out[i] = packRgb9e5(rgba[i * 4] ?? 0, rgba[i * 4 + 1] ?? 0, rgba[i * 4 + 2] ?? 0);
  }
  return out;
}

async function prefilter(
  flipped: Float32Array,
  original: Float32Array,
  width: number,
  height: number,
): Promise<Bake> {
  const threeBuild = join(root, 'node_modules', 'three', 'build');
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
    args: [
      '--enable-unsafe-webgpu',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--enable-features=Vulkan',
      '--use-vulkan=swiftshader',
      '--use-webgpu-adapter=swiftshader',
    ],
  });
  try {
    const page = await browser.newPage();
    page.on('console', (m) => {
      console.log(`[page] ${m.text()}`);
    });
    let settle: () => void = () => undefined;
    let fail: (error: Error) => void = () => undefined;
    const done = new Promise<void>((resolve, reject) => {
      settle = resolve;
      fail = reject;
    });
    const bake: Partial<Bake> = {};
    const renders = new Map<string, Partial<Check>>();
    const bytes = (a: Float32Array | Uint32Array) =>
      Buffer.from(a.buffer, a.byteOffset, a.byteLength);
    await page.route(`${ORIGIN}/**`, async (route) => {
      const url = new URL(route.request().url());
      const body = route.request().postDataBuffer() ?? Buffer.alloc(0);
      const send = (content: Buffer | string, contentType: string) =>
        route.fulfill({ status: 200, body: content, contentType });
      switch (url.pathname) {
        case '/':
          await send(readFileSync(join(root, 'scripts', 'bake', 'pmrem.html')), 'text/html');
          return;
        case '/input.json':
          await send(JSON.stringify({ width, height }), 'application/json');
          return;
        case '/input.bin':
          await send(bytes(flipped), 'application/octet-stream');
          return;
        case '/original.bin':
          await send(bytes(original), 'application/octet-stream');
          return;
        case '/result':
          if (url.searchParams.get('type') !== 'Uint16Array') {
            fail(new Error(`Expected half floats, got ${url.searchParams.get('type') ?? '?'}.`));
          }
          bake.width = Number(url.searchParams.get('width'));
          bake.height = Number(url.searchParams.get('height'));
          bake.backend = url.searchParams.get('backend') ?? '?';
          bake.packed = pack(halves(body));
          await send('ok', 'text/plain');
          return;
        case '/packed.bin':
          await send(bytes(bake.packed ?? new Uint32Array()), 'application/octet-stream');
          return;
        case '/check': {
          const backend = url.searchParams.get('backend') ?? '?';
          const entry = renders.get(backend) ?? {
            backend,
            width: Number(url.searchParams.get('width')),
            height: Number(url.searchParams.get('height')),
          };
          if (url.searchParams.get('kind') === 'reference') entry.reference = halves(body);
          else entry.baked = halves(body);
          renders.set(backend, entry);
          await send('ok', 'text/plain');
          return;
        }
        case '/done':
          settle();
          await send('ok', 'text/plain');
          return;
        case '/error':
          fail(new Error(body.toString('utf8') || 'bake failed'));
          await send('ok', 'text/plain');
          return;
        default:
          if (url.pathname.startsWith('/three/')) {
            const file = join(threeBuild, url.pathname.slice('/three/'.length));
            await send(readFileSync(file), 'text/javascript');
            return;
          }
          await route.fulfill({ status: 404, body: 'not found' });
      }
    });
    await page.goto(`${ORIGIN}/`);
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([
      done,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('The bake page timed out after 5 minutes.'));
        }, 300_000);
      }),
    ]).finally(() => {
      clearTimeout(timer);
    });
    const checks = [...renders.values()].filter(
      (c): c is Check => c.reference !== undefined && c.baked !== undefined,
    );
    if (!bake.packed || checks.length !== 2) {
      throw new Error('The bake page finished without all its results.');
    }
    return {
      width: bake.width ?? 0,
      height: bake.height ?? 0,
      backend: bake.backend ?? '?',
      packed: bake.packed,
      checks,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Relative mean absolute error between two linear renders, over the pixels the
 * reference lights (the spheres), and the same against the reference turned
 * upside down, so a flipped atlas can't pass.
 */
function compare(check: Check): { error: number; flippedError: number } {
  const { width, height, reference, baked } = check;
  let diff = 0;
  let flippedDiff = 0;
  let sum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const j = ((height - 1 - y) * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const r = reference[i + c] ?? 0;
        if (r <= 0) continue;
        sum += r;
        diff += Math.abs((baked[i + c] ?? 0) - r);
        flippedDiff += Math.abs((baked[j + c] ?? 0) - r);
      }
    }
  }
  return { error: diff / sum, flippedError: flippedDiff / sum };
}

/** Writes a render as an sRGB PNG (Reinhard tone map) for a person to look at. */
function writePreview(path: string, check: Check, data: Float32Array): void {
  const png = new PNG({ width: check.width, height: check.height });
  for (let i = 0; i < check.width * check.height; i++) {
    for (let c = 0; c < 3; c++) {
      const v = data[i * 4 + c] ?? 0;
      const mapped = v / (1 + v);
      const srgb = mapped <= 0.0031308 ? 12.92 * mapped : 1.055 * mapped ** (1 / 2.4) - 0.055;
      png.data[i * 4 + c] = Math.round(Math.min(1, Math.max(0, srgb)) * 255);
    }
    png.data[i * 4 + 3] = 255;
  }
  writeFileSync(path, PNG.sync.write(png));
}

/** Largest relative error the check accepts (RGB9E5 rounding alone is well under 1 %). */
const MAX_ERROR = 0.02;

async function main(): Promise<void> {
  const bytes = await readSource();
  const exr = new EXRLoader().setDataType(FloatType).parse(bytes.buffer as ArrayBuffer);
  const floats = exr.data as Float32Array;
  const { width, height } = exr as { width?: number; height?: number };
  if (!width || !height) throw new Error('The EXR has no size.');
  const removed = applyNightGrade(floats);
  console.log(`Night grade removed ${(removed * 100).toFixed(1)} % of the luminance.`);
  const small = downsample(floats, width, height, CUBE_SIZE * 4);
  const flipped = flipRows(small.data, small.w, small.h);
  console.log(
    `Prefiltering a ${String(small.w)} x ${String(small.h)} equirect (cube ${String(CUBE_SIZE)}).`,
  );
  const baked = await prefilter(flipped, small.data, small.w, small.h);
  for (const check of baked.checks) {
    const { error, flippedError } = compare(check);
    console.log(
      `Check on ${check.backend} against three's runtime prefilter: ${(error * 100).toFixed(2)} % mean error (upside down would be ${(flippedError * 100).toFixed(1)} %).`,
    );
    if (process.env.BAKE_PREVIEW) {
      const base = `${process.env.BAKE_PREVIEW}-${check.backend}`;
      writePreview(`${base}-reference.png`, check, check.reference);
      writePreview(`${base}-baked.png`, check, check.baked);
    }
    if (!(error <= MAX_ERROR)) {
      throw new Error(
        `On ${check.backend} the baked atlas is ${(error * 100).toFixed(2)} % off the runtime prefilter.`,
      );
    }
  }
  const file = gzipSync(
    encodeEnvironment({ width: baked.width, height: baked.height, texels: baked.packed }),
    { level: 9 },
  );
  writeFileSync(OUTPUT, file);
  console.log(
    `Wrote ${OUTPUT}: ${String(baked.width)} x ${String(baked.height)} RGB9E5 atlas, ${(file.byteLength / 1024).toFixed(0)} kB (baked on ${baked.backend}).`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
