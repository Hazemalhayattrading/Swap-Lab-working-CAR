// Temporary: captures review screenshots from several camera angles. Not committed.
import { chromium } from '@playwright/test';
const out = process.argv[2];
const base = 'http://localhost:4174/Swap-Lab-working-CAR/';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--enable-unsafe-webgpu','--enable-unsafe-swiftshader','--use-angle=swiftshader','--enable-features=Vulkan','--use-vulkan=swiftshader','--use-webgpu-adapter=swiftshader'],
});
async function open(q, vp = { width: 1280, height: 800 }) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(base + q);
  await page.waitForFunction(() => document.documentElement.dataset.sceneState === 'ready', null, { timeout: 240000 });
  await page.waitForTimeout(3000);
  return page;
}
async function shot(page, name) { await page.waitForTimeout(6000); await page.screenshot({ path: `${out}/${name}.png` }); }
let p = await open('');
await shot(p, 'desktop-webgpu-high');
await p.locator('#viewport').focus();
for (let i = 0; i < 8; i++) await p.keyboard.press('ArrowLeft');
await shot(p, 'desktop-bay-orbit-left');
for (let i = 0; i < 16; i++) await p.keyboard.press('ArrowRight');
await shot(p, 'desktop-bay-orbit-right');
for (let i = 0; i < 8; i++) await p.keyboard.press('ArrowLeft');
for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowDown');
for (let i = 0; i < 6; i++) await p.keyboard.press('+');
await shot(p, 'desktop-floor-close');
await p.close();
p = await open('?quality=low'); await shot(p, 'desktop-webgpu-low'); await p.close();
p = await open('?renderer=webgl'); await shot(p, 'desktop-webgl2-high'); await p.close();
p = await open('', { width: 390, height: 844 }); await shot(p, 'phone-webgpu-high'); await p.close();
await browser.close();
