/**
 * Spots a browser that is drawing the 3D view in software instead of on the
 * GPU: Chrome's SwiftShader, Windows' Microsoft Basic Render Driver (WARP,
 * which means no graphics driver is installed) or Mesa's llvmpipe/lavapipe on
 * Linux. None of them can hold the frame-rate targets, so the page says so and
 * explains how to turn hardware acceleration on. Pure, so it can be tested.
 */

export interface GpuIdentity {
  /** GPUAdapterInfo fields, when WebGPU is available. */
  webgpu?: {
    vendor?: string | undefined;
    architecture?: string | undefined;
    device?: string | undefined;
    description?: string | undefined;
    isFallbackAdapter?: boolean | undefined;
  };
  /** UNMASKED_RENDERER_WEBGL (or RENDERER) of a WebGL 2 context. */
  webglRenderer?: string;
}

export type SoftwareKind = 'swiftshader' | 'basic-render-driver' | 'llvmpipe' | 'fallback';

export interface SoftwareRenderer {
  kind: SoftwareKind;
  /** The renderer's name as a person would search for it. */
  name: string;
}

const PATTERNS: readonly [RegExp, SoftwareKind, string][] = [
  [/swiftshader/i, 'swiftshader', 'SwiftShader'],
  [/basic render driver|\bwarp\b/i, 'basic-render-driver', 'Microsoft Basic Render Driver'],
  [/llvmpipe|lavapipe|softpipe/i, 'llvmpipe', 'llvmpipe (Mesa)'],
];

export function detectSoftwareRenderer(id: GpuIdentity): SoftwareRenderer | undefined {
  const g = id.webgpu;
  const text = [g?.vendor, g?.architecture, g?.device, g?.description, id.webglRenderer]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .join(' | ');
  for (const [pattern, kind, name] of PATTERNS) {
    if (pattern.test(text)) return { kind, name };
  }
  if (g?.isFallbackAdapter === true)
    return { kind: 'fallback', name: 'a software fallback adapter' };
  return undefined;
}

/** What to tell the user, in plain steps, for each kind. */
export function accelerationAdvice(renderer: SoftwareRenderer): { lead: string; steps: string[] } {
  const browserSteps = [
    'Chrome or Edge: Settings, System, turn on "Use graphics acceleration when available", then Relaunch.',
    'Firefox: Settings, General, Performance: untick "Use recommended performance settings", tick "Use hardware acceleration when available", then restart Firefox.',
    'Safari (Mac): hardware acceleration is always on; update macOS if this persists.',
  ];
  switch (renderer.kind) {
    case 'basic-render-driver':
      return {
        lead: 'Windows is drawing this with the Microsoft Basic Render Driver, which means your graphics driver is not installed or not working. The 3D view will be very slow.',
        steps: [
          'Install the graphics driver for your GPU from Intel (Arc and Iris Xe), AMD or NVIDIA, or from your laptop maker, then restart.',
          ...browserSteps,
        ],
      };
    case 'llvmpipe':
      return {
        lead: 'Your system is drawing this with llvmpipe, Mesa’s software renderer, so no GPU driver is in use. The 3D view will be very slow.',
        steps: [
          'Install or enable your GPU’s Mesa or vendor driver (for Intel: the i915 or xe kernel driver and Mesa’s iris or anv).',
          ...browserSteps,
        ],
      };
    default:
      return {
        lead: `Your browser is drawing the 3D view in software (${renderer.name}) instead of on your graphics card, so it will be slow. Turning on hardware acceleration fixes it on almost every computer.`,
        steps: browserSteps,
      };
  }
}
