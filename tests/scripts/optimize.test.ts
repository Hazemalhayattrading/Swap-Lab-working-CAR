import { describe, expect, it } from 'vitest';
import { Document } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import {
  collectStats,
  createIO,
  findOutputCollisions,
  optimizeGlb,
  optimizeToGlb,
} from '../../scripts/lib/optimize';

/** A small grid mesh with duplicated vertices, so weld/meshopt have work to do. */
function gridDocument(cells: number, buffers = 1): Document {
  const doc = new Document();
  const bufferList = Array.from({ length: buffers }, (_, i) => doc.createBuffer(`buffer${i}`));
  const scene = doc.createScene('scene');
  for (let b = 0; b < buffers; b++) {
    const positions: number[] = [];
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const quad = [x, y, x + 1, y, x + 1, y + 1, x, y, x + 1, y + 1, x, y + 1];
        for (let i = 0; i < quad.length; i += 2) positions.push(quad[i] ?? 0, quad[i + 1] ?? 0, b);
      }
    }
    const position = doc
      .createAccessor()
      .setType('VEC3')
      .setArray(new Float32Array(positions))
      .setBuffer(bufferList[b] ?? null);
    const mesh = doc
      .createMesh(`grid${b}`)
      .addPrimitive(doc.createPrimitive().setAttribute('POSITION', position));
    scene.addChild(doc.createNode(`grid${b}`).setMesh(mesh));
  }
  return doc;
}

describe('asset pipeline', () => {
  it('compresses geometry with Meshopt and keeps every triangle', async () => {
    const io = await createIO();
    const input = await io.writeBinary(gridDocument(40));
    const result = await optimizeGlb(io, input, 'model-engine');

    expect(result.before.triangles).toBe(40 * 40 * 2);
    expect(result.after.triangles).toBe(result.before.triangles);
    expect(result.bytes.byteLength).toBeLessThan(input.byteLength);
    expect(result.budget.ok).toBe(true);

    const out = await io.readBinary(result.bytes);
    const used = out
      .getRoot()
      .listExtensionsUsed()
      .map((e) => e.extensionName);
    expect(used).toContain('EXT_meshopt_compression');
    expect(collectStats(out).triangles).toBe(result.before.triangles);
  });

  it('keeps mount_* empties', async () => {
    const io = await createIO();
    const doc = gridDocument(4);
    const body = doc.getRoot().listNodes()[0];
    const mountEngine = doc.createNode('mount_engine').setTranslation([0, 0.4, 1.2]);
    const mountTurbo = doc.createNode('mount_turbo').setExtras({ flange: 'T25' });
    body?.addChild(mountEngine).addChild(mountTurbo);

    const out = await io.readBinary(
      (await optimizeGlb(io, await io.writeBinary(doc), 'model-car')).bytes,
    );
    const names = out
      .getRoot()
      .listNodes()
      .map((n) => n.getName());
    expect(names).toContain('mount_engine');
    expect(names).toContain('mount_turbo');
    const turbo = out
      .getRoot()
      .listNodes()
      .find((n) => n.getName() === 'mount_turbo');
    expect(turbo?.getExtras()).toEqual({ flange: 'T25' });
  });

  it('merges a multi-buffer glTF into one GLB', async () => {
    const io = await createIO();
    const doc = gridDocument(4, 2);
    expect(doc.getRoot().listBuffers()).toHaveLength(2);
    const result = await optimizeToGlb(io, doc, 'model-part');
    const out = await io.readBinary(result.bytes);
    expect(out.getRoot().listBuffers().length).toBeLessThanOrEqual(1);
    expect(collectStats(out).triangles).toBe(2 * 4 * 4 * 2);
  });

  it('reads Draco-compressed input', async () => {
    const io = await createIO();
    const doc = gridDocument(8);
    doc.createExtension(KHRDracoMeshCompression).setRequired(true);
    await doc.transform(draco());
    const dracoGlb = await io.writeBinary(doc);

    const result = await optimizeGlb(io, dracoGlb, 'model-engine');
    const out = await io.readBinary(result.bytes);
    expect(collectStats(out).triangles).toBeGreaterThan(0);
  });
});

describe('findOutputCollisions', () => {
  it('flags inputs that would write the same file, ignoring case', () => {
    expect(
      findOutputCollisions([
        { input: 'cars/s15.glb', output: '/out/cars/s15.glb' },
        { input: 'cars/s15.gltf', output: '/out/cars/s15.glb' },
        { input: 'cars/S15.glb', output: '/out/cars/S15.glb' },
        { input: 'cars/fd.glb', output: '/out/cars/fd.glb' },
      ]),
    ).toEqual([['cars/s15.glb', 'cars/s15.gltf', 'cars/S15.glb']]);
  });
});
