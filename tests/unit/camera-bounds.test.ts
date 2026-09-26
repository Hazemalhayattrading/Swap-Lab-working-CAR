import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three/webgpu';
import { CAMERA_BOUNDS, clampToRoom } from '../../src/scene/camera';
import { ROOM } from '../../src/scene/garage';

describe('clampToRoom', () => {
  it('keeps the camera inside the walls with a margin', () => {
    const p = clampToRoom(new Vector3(50, 1.5, -50));
    expect(p.x).toBeLessThan(ROOM.halfWidth);
    expect(p.z).toBeGreaterThan(-ROOM.halfDepth);
    expect(p.x).toBe(CAMERA_BOUNDS.x);
  });

  it('keeps the camera above the floor and below the beams', () => {
    expect(clampToRoom(new Vector3(0, -3, 0)).y).toBe(CAMERA_BOUNDS.minY);
    expect(clampToRoom(new Vector3(0, 30, 0)).y).toBeLessThan(ROOM.height);
  });

  it('leaves a position inside the room alone', () => {
    const p = clampToRoom(new Vector3(1, 1.5, 2));
    expect(p.toArray()).toEqual([1, 1.5, 2]);
  });
});
