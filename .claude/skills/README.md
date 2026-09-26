# Vendored skills

Copied verbatim from upstream on 2026-09-26. To update, re-copy from the upstream path and bump the commit here.
`CLAUDE.md` wins over any skill when they disagree.

| Skill | Upstream | Commit | License |
| --- | --- | --- | --- |
| frontend-design | github.com/anthropics/skills `skills/frontend-design` | 33375500bcea98d610eb30ce10ac4e59b89c390d | Apache-2.0 (`LICENSE.txt`) |
| webapp-testing | github.com/anthropics/skills `skills/webapp-testing` | 33375500bcea98d610eb30ce10ac4e59b89c390d | Apache-2.0 (`LICENSE.txt`) |
| webgpu-threejs-tsl | github.com/dgreenheck/webgpu-claude-skill `skills/webgpu-threejs-tsl` | af2319bd01bb7cc881267a9ef42cafdaf5e9029d | MIT (stated in upstream README; no LICENSE file upstream) |
| threejs-animation, threejs-fundamentals, threejs-geometry, threejs-interaction, threejs-lighting, threejs-loaders, threejs-materials, threejs-postprocessing, threejs-shaders, threejs-textures | github.com/CloudAI-X/threejs-skills `skills/*` | b1c623076c661fc9b03dac19292e825a5d106823 | MIT (stated in upstream README; no LICENSE file upstream) |
| threejs-aaa-graphics-builder, threejs-debug-profiler | github.com/majidmanzarpour/threejs-game-skills `skills/*` | e5f301d548bb18c530afbece78cd25082f4cda9c | MIT (`LICENSE` copied from repo root) |

## Known conflicts with CLAUDE.md

- `threejs-aaa-graphics-builder` recommends AI asset generation (Tripo, Gemini) and a credential probe from `threejs-game-director`. Those sibling skills are not installed, and CLAUDE.md forbids AI-generated 3D models and asset-generation APIs. Use only its procedural, material, lighting, shader and budget guidance.
- `threejs-aaa-graphics-builder` and `threejs-debug-profiler` mention `npm run inspect:canvas` and `threejs-qa-release/scripts/inspect-threejs-canvas.mjs`, which are not installed here.
- `webapp-testing` is written for Python Playwright. This project uses `@playwright/test` via `npm run e2e`; follow the skill's approach, not its language.
- `threejs-postprocessing` has a WebGPU section importing from `three/addons/nodes/Nodes.js`, which is outdated. For WebGPU, follow `webgpu-threejs-tsl` (`three/webgpu`, `three/tsl`).
