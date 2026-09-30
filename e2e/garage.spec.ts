import { mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

const SHOTS = 'test-results/screenshots';
mkdirSync(SHOTS, { recursive: true });

interface Budget {
  frame: {
    drawCalls: Record<string, number>;
    triangles: Record<string, number>;
  };
}
const budget = JSON.parse(readFileSync('perf-budget.json', 'utf8')) as Budget;

interface Hooks {
  frames: number;
  rendering: boolean;
  quality: string;
  lastFrame: { drawCalls: number; triangles: number };
}
const hooks = (page: Page) =>
  page.evaluate(() => {
    const s = (window as unknown as { __SWAPLAB__: Hooks }).__SWAPLAB__;
    return {
      frames: s.frames,
      rendering: s.rendering,
      quality: s.quality,
      lastFrame: { ...s.lastFrame },
    };
  });

/**
 * Opens the garage and collects page errors, console errors and failed requests.
 * CI renders in software (SwiftShader), so the hardware-acceleration notice is
 * dismissed up front unless a test is about it.
 */
async function openGarage(page: Page, query = '', keepNotice = false): Promise<string[]> {
  if (!keepNotice) {
    await page.addInitScript(() => {
      sessionStorage.setItem('swaplab.gpuNoticeDismissed', 'swiftshader');
    });
  }
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

/**
 * Mean and standard deviation of luminance (0..1) over the 3D view: above the
 * telemetry strip and outside the dyno sheet panel.
 */
async function viewportStats(page: Page, file: string): Promise<{ mean: number; std: number }> {
  const buffer = await page.screenshot({ path: `${SHOTS}/${file}` });
  const png = PNG.sync.read(buffer);
  const telemetry = await page.locator('#telemetry').boundingBox();
  const dyno = await page.locator('#dyno').boundingBox();
  const bottom = Math.floor(telemetry ? telemetry.y : png.height);
  const inDyno = (x: number, y: number) =>
    dyno !== null &&
    x >= dyno.x &&
    x <= dyno.x + dyno.width &&
    y >= dyno.y &&
    y <= dyno.y + dyno.height;
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 0; y < bottom; y += 4) {
    for (let x = 0; x < png.width; x += 4) {
      if (inDyno(x, y)) continue;
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

test('software rendering shows how to turn on hardware acceleration', async ({ page }) => {
  const problems = await openGarage(page, '', true);
  const notice = page.locator('#gpu-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute('data-kind', 'swiftshader');
  await expect(notice).toContainText('drawing in software');
  await notice.getByText('How to turn on hardware acceleration').click();
  await expect(page.locator('#gpu-notice-steps li')).not.toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/garage-gpu-notice.png` });

  await page.getByRole('button', { name: 'Switch to Low quality' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-quality', 'low');
  await expect(page.locator('#gpu-notice-low')).toHaveText('Low quality on');
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(notice).toBeHidden();
  // Dismissed for the session.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 240_000,
  });
  await expect(notice).toBeHidden();
  expect(problems).toEqual([]);
});

test('draws on demand: idle when nothing moves, a frame when something does', async ({ page }) => {
  const problems = await openGarage(page);
  await expect.poll(async () => (await hooks(page)).rendering, { timeout: 120_000 }).toBe(false);
  await expect(page.locator('#readout-fps')).toHaveText('idle');
  const idle = (await hooks(page)).frames;
  await page.waitForTimeout(1500);
  expect((await hooks(page)).frames).toBe(idle);

  // Within the frame budget for this quality.
  const { lastFrame, quality } = await hooks(page);
  expect(lastFrame.drawCalls).toBeGreaterThan(0);
  expect(lastFrame.drawCalls).toBeLessThanOrEqual(budget.frame.drawCalls[quality] ?? 0);
  expect(lastFrame.triangles).toBeLessThanOrEqual(budget.frame.triangles[quality] ?? 0);

  await page.locator('#viewport').focus();
  await page.keyboard.press('ArrowLeft');
  await expect
    .poll(async () => (await hooks(page)).frames, { timeout: 60_000 })
    .toBeGreaterThan(idle);
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

  // A quality change redraws the scene, even though nothing else moves.
  const framesBefore = (await hooks(page)).frames;
  await page.getByRole('radio', { name: 'High' }).check();
  await page.getByRole('radio', { name: 'Low' }).check();
  await expect
    .poll(async () => (await hooks(page)).frames, { timeout: 120_000 })
    .toBeGreaterThan(framesBefore);
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
  for (const selector of ['.shop-tag', '#telemetry', '#bay-note', '#quality', '#dyno']) {
    const box = (await page.locator(selector).boundingBox()) ?? { x: -1, width: 0 };
    expect(box.x, selector).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, selector).toBeLessThanOrEqual(390);
  }
  expectLitGarage(await viewportStats(page, 'garage-phone.png'));
  expect(problems).toEqual([]);
});
