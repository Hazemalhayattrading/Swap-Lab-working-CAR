import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

const SHOTS = 'test-results/screenshots';
mkdirSync(SHOTS, { recursive: true });

/** Opens the garage and collects page errors, console errors and failed requests. */
async function openGarage(page: Page, query = ''): Promise<string[]> {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
  });
  await page.goto(`./${query}`);
  await expect(page.locator('html')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 240_000,
  });
  return problems;
}

/** Mean and standard deviation of luminance (0..1) over the 3D view, above the telemetry strip. */
async function viewportStats(page: Page, file: string): Promise<{ mean: number; std: number }> {
  const buffer = await page.screenshot({ path: `${SHOTS}/${file}` });
  const png = PNG.sync.read(buffer);
  const telemetry = await page.locator('#telemetry').boundingBox();
  const bottom = Math.floor(telemetry ? telemetry.y : png.height);
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 0; y < bottom; y += 4) {
    for (let x = 0; x < png.width; x += 4) {
      const i = (y * png.width + x) * 4;
      const l =
        (0.2126 * (png.data[i] ?? 0) +
          0.7152 * (png.data[i + 1] ?? 0) +
          0.0722 * (png.data[i + 2] ?? 0)) /
        255;
      sum += l;
      sumSq += l * l;
      n++;
    }
  }
  const mean = sum / n;
  return { mean, std: Math.sqrt(Math.max(sumSq / n - mean * mean, 0)) };
}

function expectLitGarage(stats: { mean: number; std: number }): void {
  // A black or flat canvas means nothing rendered. A night-shift bay is dark
  // overall but has lit floor, walls and fixtures, so there is real contrast.
  expect(stats.mean).toBeGreaterThan(0.04);
  expect(stats.mean).toBeLessThan(0.7);
  expect(stats.std).toBeGreaterThan(0.04);
}

test('opens straight into the lit garage on the best available backend', async ({ page }) => {
  const problems = await openGarage(page);
  const hasWebGPU = await page.evaluate(async () =>
    'gpu' in navigator ? (await navigator.gpu.requestAdapter()) !== null : false,
  );
  const html = page.locator('html');

  await expect(html).toHaveAttribute('data-backend', hasWebGPU ? 'webgpu' : 'webgl2');
  await expect(page.locator('#readout-backend')).toHaveText(hasWebGPU ? 'WebGPU' : 'WebGL 2');
  await expect(html).toHaveAttribute('data-environment', 'autoshop_01');

  // No landing page: the 3D view fills the window and the empty-bay note is up.
  const canvas = await page.locator('#viewport').boundingBox();
  expect(canvas?.width).toBe(1280);
  expect(canvas?.height).toBe(800);
  await expect(page.locator('#bay-note')).toBeVisible();
  await expect(page.locator('.shop-tag')).toContainText('Swap Lab');

  expectLitGarage(await viewportStats(page, `garage-${hasWebGPU ? 'webgpu' : 'webgl2'}.png`));
  expect(problems).toEqual([]);
});

test('falls back to WebGL 2 and renders the same garage', async ({ page }) => {
  const problems = await openGarage(page, '?renderer=webgl');
  await expect(page.locator('html')).toHaveAttribute('data-backend', 'webgl2');
  await expect(page.locator('#readout-backend')).toHaveText('WebGL 2 (forced)');
  await expect(page.locator('html')).toHaveAttribute('data-environment', 'autoshop_01');
  expectLitGarage(await viewportStats(page, 'garage-webgl2-forced.png'));
  expect(problems).toEqual([]);
});

test('quality presets switch, persist and keep rendering', async ({ page }) => {
  const problems = await openGarage(page);
  await expect(page.locator('html')).toHaveAttribute('data-quality', 'high');

  await page.getByRole('radio', { name: 'Low' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-quality', 'low');
  expect(await page.evaluate(() => localStorage.getItem('swaplab.quality'))).toBe('low');

  const framesBefore = await page.evaluate(
    () => (window as unknown as { __SWAPLAB__: { frames: number } }).__SWAPLAB__.frames,
  );
  await expect
    .poll(
      () =>
        page.evaluate(
          () => (window as unknown as { __SWAPLAB__: { frames: number } }).__SWAPLAB__.frames,
        ),
      {
        timeout: 120_000,
      },
    )
    .toBeGreaterThan(framesBefore + 1);
  expectLitGarage(await viewportStats(page, 'garage-quality-low.png'));

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 240_000,
  });
  await expect(page.locator('html')).toHaveAttribute('data-quality', 'low');
  await expect(page.getByRole('radio', { name: 'Low' })).toBeChecked();
  expect(problems).toEqual([]);
});

test('readouts panel collapses and expands', async ({ page }) => {
  const problems = await openGarage(page);
  const toggle = page.locator('#telemetry-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveText('Show panel');
  await expect(page.locator('#telemetry-body')).toBeHidden();
  await toggle.click();
  await expect(page.locator('#telemetry-body')).toBeVisible();
  expectLitGarage(await viewportStats(page, 'garage-panel-toggled.png'));
  expect(problems).toEqual([]);
});

test('the camera can be moved with the keyboard', async ({ page }) => {
  const problems = await openGarage(page);
  const cameraPosition = () =>
    page.evaluate(
      () => (window as unknown as { __SWAPLAB__: { camera: number[] } }).__SWAPLAB__.camera,
    );
  const before = await cameraPosition();
  await page.locator('#viewport').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('-');
  const after = await cameraPosition();
  expect(after).not.toEqual(before);
  const dist = (p: number[]) => Math.hypot(p[0] ?? 0, (p[1] ?? 0) - 0.6, (p[2] ?? 0) - 0.2);
  expect(dist(after)).toBeGreaterThan(dist(before));
  expect(problems).toEqual([]);
});

test('fits a phone screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const problems = await openGarage(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  for (const selector of ['.shop-tag', '#telemetry', '#bay-note', '#quality']) {
    const box = (await page.locator(selector).boundingBox()) ?? { x: -1, width: 0 };
    expect(box.x, selector).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, selector).toBeLessThanOrEqual(390);
  }
  expectLitGarage(await viewportStats(page, 'garage-phone.png'));
  expect(problems).toEqual([]);
});
