# Phase 1 screenshots

Captured 2026-09-26 by Playwright in headless Chromium using software rendering (SwiftShader), at 1280 x 800 and 390 x 844. Phase 1 is a data phase, so the only visual change is the lighting: Poly Haven's _Autoshop 01_ HDRI (2k) replaces the interim warehouse HDRI, with the night grade applied (see `docs/decisions.md`). Frame times in the readouts are software-rendering times, not real performance.

| File                                         | View                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `desktop-webgpu-high.jpg`                    | Opening view, WebGPU, High quality                                                  |
| `desktop-bay-orbit-left.jpg`                 | Orbited left: flood lamp, strips overhead                                           |
| `desktop-bay-orbit-right.jpg`                | Orbited right: bay outline, oil stains, drain                                       |
| `desktop-floor-close.jpg`                    | Low and close: oil stains and the lamp's reflection                                 |
| `desktop-floor-close-before-night-grade.jpg` | Same view before the night grade: the blue skylight glint in the oil stain it fixes |
| `desktop-webgl2-high.jpg`                    | Forced WebGL 2 fallback, High quality (matches the WebGPU view)                     |
| `desktop-webgpu-low.jpg`                     | Low quality (no bloom, shadows or MSAA)                                             |
| `phone-webgpu-high.jpg`                      | Phone layout                                                                        |
