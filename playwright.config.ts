import { defineConfig } from '@playwright/test';

/**
 * Smoke tests and screenshots against the production build, served under the
 * same base path GitHub Pages uses, so broken asset paths fail here first.
 *
 * GPU: headless Chromium renders WebGPU and WebGL 2 in software (SwiftShader),
 * so frames take seconds. That is why timeouts are long and workers = 1.
 * Do not add --disable-vulkan-surface: it stops WebGPU canvases from appearing
 * in screenshots.
 */
const basePath = process.env.BASE_PATH ?? '/Swap-Lab-working-CAR/';
const port = 4173;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/artifacts',
  timeout: 300_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: isCI,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}${basePath}`,
    viewport: { width: 1280, height: 800 },
    channel: 'chromium',
    launchOptions: {
      // Lets a machine with a different pre-installed Chromium run the suite.
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
    },
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    env: { BASE_PATH: basePath },
    url: `http://localhost:${port}${basePath}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
