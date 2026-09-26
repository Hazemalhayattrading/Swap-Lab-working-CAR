import {
  BoxGeometry,
  BufferAttribute,
  type BufferGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  Object3D,
  PlaneGeometry,
  RectAreaLight,
  SpotLight,
  type Material,
} from 'three/webgpu';
import { color } from 'three/tsl';
import { createConcreteFloorMaterial } from './materials/concrete-floor';
import {
  createBlockWallMaterial,
  createCeilingMaterial,
  createPaintedSteelMaterial,
  createRollerDoorMaterial,
} from './materials/shop-surfaces';

/**
 * The empty night-shift bay: a two-bay workshop shell in metres, with only the
 * working bay's strip lights on and one warm flood lamp on the back wall.
 * The lift and car arrive in Phase 4; nothing here stands in for them.
 */

export const ROOM = { halfWidth: 7.5, halfDepth: 8, height: 5 } as const;

/**
 * Blackbody colours as sRGB hex: ~5000 K LED battens (neutral shop white) and a
 * ~2700 K halogen-style flood lamp.
 */
const STRIP_WHITE = '#ffe4ce';
const LAMP_WARM = '#ffa957';

export interface GarageRig {
  root: Group;
  /** Lights whose shadow resolution follows the quality setting. */
  shadowLights: SpotLight[];
  dispose(): void;
}

/** PlaneGeometry whose UVs are in metres, so procedural materials keep real scale. */
function metricPlane(width: number, height: number): PlaneGeometry {
  const geometry = new PlaneGeometry(width, height);
  const uv = geometry.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width, uv.getY(i) * height);
  uv.needsUpdate = true;
  return geometry;
}

function place(object: Object3D, x: number, y: number, z: number): Object3D {
  object.position.set(x, y, z);
  return object;
}

function buildShell(root: Group): void {
  const { halfWidth: hw, halfDepth: hd, height: h } = ROOM;

  const floor = new Mesh(metricPlane(hw * 2, hd * 2), createConcreteFloorMaterial());
  floor.name = 'floor';
  floor.rotation.x = -Math.PI / 2;
  // UVs are unused by the floor (it samples world position), but keep them metric anyway.
  floor.receiveShadow = true;
  root.add(floor);

  const wallMaterial = createBlockWallMaterial();
  const walls: [string, number, number, number, number][] = [
    // name, width, x, z, rotationY
    ['wall_back', hw * 2, 0, -hd, 0],
    ['wall_front', hw * 2, 0, hd, Math.PI],
    ['wall_left', hd * 2, -hw, 0, Math.PI / 2],
    ['wall_right', hd * 2, hw, 0, -Math.PI / 2],
  ];
  for (const [name, width, x, z, ry] of walls) {
    const wall = new Mesh(metricPlane(width, h), wallMaterial);
    wall.name = name;
    wall.position.set(x, h / 2, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    root.add(wall);
  }

  const door = new Mesh(metricPlane(4.2, 3.6), createRollerDoorMaterial());
  door.name = 'roller_door';
  door.position.set(0.6, 1.8, hd - 0.03);
  door.rotation.y = Math.PI;
  door.receiveShadow = true;
  root.add(door);

  const steel = createPaintedSteelMaterial();
  const doorFrameParts: [number, number, number, number, number][] = [
    // w, h, x, y  (all at the door plane)
    [0.12, 3.7, 0.6 - 2.16, 1.85, 0],
    [0.12, 3.7, 0.6 + 2.16, 1.85, 0],
    [4.44, 0.3, 0.6, 3.75, 0],
  ];
  for (const [w, fh, x, y] of doorFrameParts) {
    const part = new Mesh(new BoxGeometry(w, fh, 0.12), steel);
    part.position.set(x, y, hd - 0.06);
    part.castShadow = true;
    root.add(part);
  }

  const ceiling = new Mesh(metricPlane(hw * 2, hd * 2), createCeilingMaterial());
  ceiling.name = 'ceiling';
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = h;
  root.add(ceiling);

  // Steel beams spanning the width, every 4 m.
  for (const z of [-6, -2, 2, 6]) {
    const web = new Mesh(new BoxGeometry(hw * 2, 0.36, 0.012), steel);
    const flangeTop = new Mesh(new BoxGeometry(hw * 2, 0.014, 0.17), steel);
    const flangeBottom = flangeTop.clone();
    place(web, 0, h - 0.2, z);
    place(flangeTop, 0, h - 0.02, z);
    place(flangeBottom, 0, h - 0.38, z);
    root.add(web, flangeTop, flangeBottom);
  }
}

interface FixtureMaterials {
  housing: Material;
  wire: Material;
  on: Material;
  off: Material;
}

function buildStripFixture(
  root: Group,
  x: number,
  z: number,
  lit: boolean,
  materials: FixtureMaterials,
): void {
  const hangY = 3.7;
  const length = 2.4;
  const group = new Group();
  group.name = lit ? 'strip_light_on' : 'strip_light_off';
  group.position.set(x, hangY, z);

  const housing = new Mesh(new BoxGeometry(0.24, 0.09, length), materials.housing);
  housing.castShadow = true;
  group.add(housing);

  const diffuser = new Mesh(
    new PlaneGeometry(0.2, length - 0.06),
    lit ? materials.on : materials.off,
  );
  diffuser.rotation.x = Math.PI / 2;
  diffuser.position.y = -0.046;
  group.add(diffuser);

  const wireLength = ROOM.height - hangY - 0.045;
  for (const dz of [-length / 2 + 0.2, length / 2 - 0.2]) {
    const wire = new Mesh(new CylinderGeometry(0.003, 0.003, wireLength, 6), materials.wire);
    wire.position.set(0, 0.045 + wireLength / 2, dz);
    group.add(wire);
  }

  if (lit) {
    // Area light matches the diffuser, facing straight down; long axis along z.
    const light = new RectAreaLight(STRIP_WHITE, 14, 0.2, length - 0.06);
    light.position.y = -0.05;
    light.rotation.x = -Math.PI / 2;
    group.add(light);
  }
  root.add(group);
}

function buildFloodLamp(root: Group): SpotLight {
  const mount = new Group();
  mount.name = 'flood_lamp';
  const steel = createPaintedSteelMaterial('#1f2123');
  const bracket = new Mesh(new BoxGeometry(0.05, 0.05, 0.32), steel);
  bracket.position.z = 0.16;
  const head = new Mesh(new BoxGeometry(0.3, 0.22, 0.12), steel);
  head.position.z = 0.36;
  head.rotation.x = 0.55;
  head.castShadow = true;
  const lens = new Mesh(
    new PlaneGeometry(0.25, 0.17),
    new MeshBasicNodeMaterial({ colorNode: color(LAMP_WARM).mul(9) }),
  );
  lens.position.z = 0.061; // just proud of the head's front face
  head.add(lens);
  mount.add(bracket, head);
  mount.position.set(-3.1, 2.9, -ROOM.halfDepth);
  // Yaw the lamp toward the bay; the head's 0.55 rad tilt aims it down at the floor.
  mount.rotation.y = 0.39;
  root.add(mount);

  const spot = new SpotLight(LAMP_WARM, 70, 0, 0.72, 0.85, 2);
  spot.name = 'flood_lamp_light';
  spot.position.set(-2.95, 2.85, -ROOM.halfDepth + 0.4);
  spot.target.position.set(-0.9, 0, -2.2);
  spot.castShadow = true;
  spot.shadow.bias = -0.0004;
  spot.shadow.normalBias = 0.02;
  spot.shadow.radius = 4;
  root.add(spot, spot.target);
  return spot;
}

function buildOverheadShadowCaster(root: Group): SpotLight {
  // The strip lights have no shadows (area lights can't cast them in three.js), so
  // one wide, soft, dim spot above the bay grounds whatever stands on the lift.
  const spot = new SpotLight(STRIP_WHITE, 16, 0, 1.0, 1, 2);
  spot.name = 'overhead_shadow_light';
  spot.position.set(0, ROOM.height - 0.45, 0.2);
  spot.target.position.set(0, 0, 0.2);
  spot.castShadow = true;
  spot.shadow.bias = -0.0003;
  spot.shadow.normalBias = 0.02;
  spot.shadow.radius = 6;
  root.add(spot, spot.target);
  return spot;
}

export function buildGarage(): GarageRig {
  const root = new Group();
  root.name = 'garage';
  buildShell(root);

  const materials: FixtureMaterials = {
    housing: new MeshStandardNodeMaterial({ color: '#c9cbcc', roughness: 0.5, metalness: 0.4 }),
    wire: new MeshStandardNodeMaterial({ color: '#808284', roughness: 0.4, metalness: 0.9 }),
    // HDR emissive so the bloom pass picks the diffusers up.
    on: new MeshBasicNodeMaterial({ colorNode: color(STRIP_WHITE).mul(7) }),
    off: new MeshStandardNodeMaterial({ color: '#b9bcbe', roughness: 0.35, metalness: 0 }),
  };
  for (const x of [-1.25, 1.25]) {
    for (const z of [-2.55, 0, 2.55]) buildStripFixture(root, x, z, true, materials);
  }
  // Neighbouring bays are dark tonight.
  for (const x of [-5.2, 5.2]) {
    for (const z of [-2.55, 0, 2.55]) buildStripFixture(root, x, z, false, materials);
  }

  const shadowLights = [buildFloodLamp(root), buildOverheadShadowCaster(root)];

  return {
    root,
    shadowLights,
    dispose() {
      root.traverse((object) => {
        if (object instanceof Mesh) {
          (object.geometry as BufferGeometry).dispose();
          const material = object.material as Material | Material[];
          for (const m of Array.isArray(material) ? material : [material]) m.dispose();
        }
      });
    },
  };
}
