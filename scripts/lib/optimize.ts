import { type Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  inspect,
  meshopt,
  prune,
  resample,
  unpartition,
  weld,
} from '@gltf-transform/functions';
import draco3d from 'draco3d';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { checkBudget, type BudgetResult } from '../../src/data/policy';

/**
 * The glTF optimisation steps behind `npm run assets`, kept free of file-system
 * code so tests can run them on in-memory documents.
 *
 * Phase 0 scope: structural clean-up, geometry compression, size budgets.
 * Phase 4 adds part renaming to our naming convention, mount_* empties, LODs and
 * KTX2 texture compression (tracked in docs/progress.md).
 */

export async function createIO(): Promise<NodeIO> {
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
    // Marketplace GLBs are often Draco-compressed; decode them so they can be re-encoded.
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });
}

export interface OptimizeStats {
  triangles: number;
  meshes: number;
  materials: number;
  textures: number;
  textureBytes: number;
}

export function collectStats(doc: Document): OptimizeStats {
  const report = inspect(doc);
  let triangles = 0;
  for (const mesh of report.meshes.properties) {
    // glPrimitives counts triangles for TRIANGLES mode, which is what we ship.
    triangles += mesh.glPrimitives * Math.max(mesh.instances, 1);
  }
  return {
    triangles,
    meshes: report.meshes.properties.length,
    materials: report.materials.properties.length,
    textures: report.textures.properties.length,
    textureBytes: report.textures.properties.reduce((sum, t) => sum + t.size, 0),
  };
}

/** Clean-up and Meshopt geometry compression, in place. */
export async function optimizeDocument(doc: Document): Promise<void> {
  await doc.transform(
    dedup(),
    // Keep empty nodes: mount_* points are empties by design (CLAUDE.md naming list).
    prune({ keepLeaves: true, keepExtras: true }),
    weld(),
    resample(),
    // A GLB holds one buffer; .gltf exports often split geometry across several.
    unpartition(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
}

export interface OptimizeResult {
  bytes: Uint8Array;
  before: OptimizeStats;
  after: OptimizeStats;
  budget: BudgetResult;
}

/** Optimises a document and checks the resulting GLB against the kind's budget. */
export async function optimizeToGlb(
  io: NodeIO,
  doc: Document,
  kind: string,
): Promise<OptimizeResult> {
  const before = collectStats(doc);
  await optimizeDocument(doc);
  const bytes = await io.writeBinary(doc);
  return { bytes, before, after: collectStats(doc), budget: checkBudget(kind, bytes.byteLength) };
}

/** Reads a GLB, optimises it and checks the result against the kind's budget. */
export async function optimizeGlb(
  io: NodeIO,
  input: Uint8Array,
  kind: string,
): Promise<OptimizeResult> {
  return optimizeToGlb(io, await io.readBinary(input), kind);
}

/**
 * Output paths that more than one input would write to, compared case-insensitively
 * (macOS and Windows file systems treat S15.glb and s15.glb as the same file).
 */
export function findOutputCollisions(
  outputs: readonly { input: string; output: string }[],
): string[][] {
  const byKey = new Map<string, string[]>();
  for (const { input, output } of outputs) {
    const key = output.toLowerCase();
    byKey.set(key, [...(byKey.get(key) ?? []), input]);
  }
  return [...byKey.values()].filter((inputs) => inputs.length > 1);
}
