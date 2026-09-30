import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * The dyno sheet (Phase 2a): numbers come from the simulation worker, are
 * shown only for trims whose stock check passes, and the panel stays out of
 * the 3D view's way on a phone.
 */

const SHOTS = 'test-results/screenshots';
mkdirSync(SHOTS, { recursive: true });

async function openSheet(page: Page): Promise<string[]> {
  // CI draws in software; the acceleration notice has its own test (garage.spec.ts).
  await page.addInitScript(() => {
    sessionStorage.setItem('swaplab.gpuNoticeDismissed', 'swiftshader');
  });
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
  });
  // The low preset keeps SwiftShader's frames short; the sheet doesn't depend on the 3D view.
  await page.goto('./?quality=low');
  await expect(page.locator('#dyno')).toHaveAttribute('data-state', 'ready', { timeout: 120_000 });
  return problems;
}

const powerReadout = (page: Page) => page.locator('.readout-cell__value').first();

test('shows the default car’s dyno sheet with a passed stock check', async ({ page }) => {
  const problems = await openSheet(page);
  const dyno = page.locator('#dyno');
  await expect(dyno).toHaveAttribute('data-trim', 'nissan-silvia-s15/jdm-spec-r-6mt');
  await expect(page.locator('.sticker')).toContainText('Stock check passed');
  await expect(page.locator('.sticker')).toContainText('JIS D 1001');
  await expect(page.locator('#dyno-summary')).toContainText(/\d+\s*hp, \d+\s*N·m/);
  await expect(page.locator('.chart')).toBeVisible();
  await expect(page.locator('.chart .chart__trace--power')).toHaveCount(1);
  await expect(page.locator('.chart .chart__band--power')).toHaveCount(1);
  // Defaults: 45 °C in Riyadh (about 600 m) on PG95.
  await expect(page.getByRole('radio', { name: '45', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Riyadh', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: '95', exact: true })).toBeChecked();
  await expect(page.locator('#dyno-altitude-note')).toContainText('94.2 kPa');
  await expect(page.locator('.readouts-block__at')).toContainText('45');
  await expect(page.locator('.readouts-block__at')).toContainText('Riyadh');
  // The heat-soak test: on generic cooling sizing the stamp says estimated, not passed or failed.
  await expect(page.locator('.soak')).toBeVisible();
  await expect(page.locator('.soak-stamp')).toHaveText(/Estimated\s*generic sizing/);
  await expect(page.locator('.soak-chart__line--coolant')).toHaveCount(1);
  await expect(page.locator('.limit-tag--estimated')).toContainText('Cooling');
  // Only the Supra carries a build-count exception on its sticker.
  await expect(page.locator('.sticker__scope')).toHaveCount(0);
  // The sheet doesn't wait for the 3D view; the screenshot does, so it shows both.
  await expect(page.locator('html')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 240_000,
  });
  await page.screenshot({ path: `${SHOTS}/dyno-desktop.png` });
  expect(problems).toEqual([]);
});

test('a cooler day, another trim and other units rerun the sheet', async ({ page }) => {
  const problems = await openSheet(page);
  const hot = Number.parseFloat((await powerReadout(page).textContent()) ?? '');
  await page.getByRole('radio', { name: '25', exact: true }).check();
  // A 25 °C day makes more power than the 45 °C default.
  await expect
    .poll(async () => Number.parseFloat((await powerReadout(page).textContent()) ?? ''))
    .toBeGreaterThan(hot);

  await page.locator('#dyno-car').selectOption('toyota-supra-jza80');
  await expect(page.locator('#dyno')).toHaveAttribute('data-trim', /^toyota-supra-jza80\//);
  await expect(page.locator('#dyno')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.sheet__car')).toContainText('Toyota Supra');
  await expect(page.locator('.sticker__scope')).toHaveText(
    'Known builds: validated on stock turbos only; big-turbo builds unverified.',
  );
  await page.locator('.sticker').screenshot({ path: `${SHOTS}/dyno-supra-sticker.png` });

  await page.getByRole('radio', { name: 'PS', exact: true }).check();
  await expect(powerReadout(page)).toContainText('PS');
  await page.getByRole('radio', { name: 'lb-ft', exact: true }).check();
  await expect(page.locator('.readout-cell__value').nth(1)).toContainText('lb-ft');

  // The choices persist.
  await page.reload();
  await expect(page.locator('#dyno')).toHaveAttribute('data-state', 'ready', { timeout: 120_000 });
  await expect(page.locator('#dyno')).toHaveAttribute('data-trim', /^toyota-supra-jza80\//);
  await expect(page.getByRole('radio', { name: '25', exact: true })).toBeChecked();
  await expect(powerReadout(page)).toContainText('PS');
  expect(problems).toEqual([]);
});

test('altitude and fuel rerun the sheet and say what they do', async ({ page }) => {
  const problems = await openSheet(page);
  const riyadh = Number.parseFloat((await powerReadout(page).textContent()) ?? '');

  // The S15 is turbocharged: at sea level it needs less boost for the same air.
  await page.getByRole('radio', { name: 'Jeddah', exact: true }).check();
  await expect(page.locator('#dyno-altitude-note')).toContainText('101.3 kPa');
  await expect(page.locator('.readouts-block__at')).toContainText('Jeddah');
  await expect
    .poll(async () => Number.parseFloat((await powerReadout(page).textContent()) ?? ''))
    .toBeGreaterThanOrEqual(riyadh);

  // A custom elevation takes a number and shows its pressure.
  await page.getByRole('radio', { name: 'Custom', exact: true }).check();
  const elevation = page.locator('#dyno-elevation');
  await elevation.fill('2000');
  await elevation.press('Enter');
  await expect(page.locator('#dyno-elevation-pressure')).toContainText('79.5 kPa');
  await expect(page.locator('.readouts-block__at')).toContainText('2,000 m');

  // A naturally aspirated car loses power with the altitude.
  await page.locator('#dyno-car').selectOption('nissan-350z-z33');
  await expect(page.locator('#dyno')).toHaveAttribute('data-trim', /^nissan-350z-z33\//);
  await expect(page.locator('#dyno')).toHaveAttribute('data-state', 'ready');
  const high = Number.parseFloat((await powerReadout(page).textContent()) ?? '');
  await page.getByRole('radio', { name: 'Jeddah', exact: true }).check();
  await expect
    .poll(async () => Number.parseFloat((await powerReadout(page).textContent()) ?? ''))
    .toBeGreaterThan(high * 1.15);

  // Fuel: where it is sold, and a tune for race fuel and E85.
  await page.getByRole('radio', { name: '98', exact: true }).check();
  await expect(page.locator('#dyno-fuel-note')).toContainText('Riyadh, Jeddah');
  await page.getByRole('radio', { name: 'E85', exact: true }).check();
  await expect(page.locator('#dyno-fuel-note')).toContainText('No E85 at Saudi pumps');
  await expect(page.locator('#dyno-fuel-note')).toContainText('Needs a tune');
  await expect(page.locator('.readouts-block__at')).toContainText('E85');
  await page.screenshot({ path: `${SHOTS}/dyno-altitude-fuel.png` });
  expect(problems).toEqual([]);
});

test('the chart reads out any rpm from the keyboard', async ({ page }) => {
  const problems = await openSheet(page);
  const chart = page.locator('.chart');
  await chart.focus();
  await page.keyboard.press('Home');
  await expect(page.locator('.cursor-line')).toContainText(/^[\d,]+\s*rpm:/);
  const first = await page.locator('.cursor-line').textContent();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.cursor-line')).not.toHaveText(first ?? '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.cursor-line')).toContainText('arrow keys');
  expect(problems).toEqual([]);
});

test('“How we calculate this” opens, lists every assumption and closes', async ({ page }) => {
  const problems = await openSheet(page);
  await page.locator('#dyno-body').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.getByRole('button', { name: 'How we calculate this' }).click();
  const drawer = page.getByRole('dialog', { name: 'How we calculate this' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('heading', { name: 'Airflow first' })).toBeVisible();
  await expect(drawer.locator('.manual__table--assumptions tbody tr')).not.toHaveCount(0);
  const rows = await drawer.locator('.manual__table--assumptions tbody tr').count();
  expect(rows).toBeGreaterThanOrEqual(110);
  // The known-build table, every build inside its 10 % mark.
  await expect(drawer.getByRole('heading', { name: 'Known builds' })).toBeVisible();
  await expect(drawer.locator('.manual__table--builds')).toBeVisible({ timeout: 60_000 });
  expect(
    await drawer.locator('.manual__table--builds tbody tr:not(.manual__car)').count(),
  ).toBeGreaterThanOrEqual(15);
  await expect(drawer.locator('.manual__miss')).toHaveCount(0);
  await expect(drawer.locator('.manual__car', { hasText: 'Supra' })).toContainText(
    'validated on stock turbos only; big-turbo builds unverified',
  );
  await drawer.getByRole('heading', { name: 'Known builds' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/dyno-manual-builds.png` });
  await page.screenshot({ path: `${SHOTS}/dyno-manual.png` });
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  expect(problems).toEqual([]);
});

test('on a phone the sheet is a collapsed bar that opens without sideways scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const problems = await openSheet(page);
  const toggle = page.locator('#dyno-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#dyno-body')).toBeHidden();
  await page.screenshot({ path: `${SHOTS}/dyno-phone-collapsed.png` });

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#dyno-body')).toBeVisible();
  await expect(page.locator('.sticker')).toContainText('Stock check passed');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  for (const selector of ['#dyno', '.chart-host', '.sticker', '#dyno-car', '#dyno-trim']) {
    const box = (await page.locator(selector).boundingBox()) ?? { x: -1, width: 0 };
    expect(box.x, selector).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, selector).toBeLessThanOrEqual(390);
  }
  await page.screenshot({ path: `${SHOTS}/dyno-phone-open.png` });
  expect(problems).toEqual([]);
});
