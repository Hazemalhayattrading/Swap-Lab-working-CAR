import { MathUtils, PerspectiveCamera, Spherical, Vector3 } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROOM } from './garage';

/** Where the camera looks: the middle of the lift bay, about sill height. */
export const BAY_TARGET = new Vector3(0, 0.6, 0.2);
const START_POSITION = new Vector3(4.9, 1.55, 5.6);

/** Keeps the camera inside the shop walls, above the floor, below the beams. */
export const CAMERA_BOUNDS = {
  x: ROOM.halfWidth - 0.4,
  z: ROOM.halfDepth - 0.4,
  minY: 0.25,
  maxY: ROOM.height - 0.9,
} as const;

export function clampToRoom(position: Vector3): Vector3 {
  position.x = MathUtils.clamp(position.x, -CAMERA_BOUNDS.x, CAMERA_BOUNDS.x);
  position.z = MathUtils.clamp(position.z, -CAMERA_BOUNDS.z, CAMERA_BOUNDS.z);
  position.y = MathUtils.clamp(position.y, CAMERA_BOUNDS.minY, CAMERA_BOUNDS.maxY);
  return position;
}

export interface CameraRig {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  /** Steps the orbit damping; returns true while the camera is still moving. */
  update(): boolean;
  resize(width: number, height: number): void;
  /** Handles a keydown on the focused view; returns true if the key moved the camera. */
  handleKey(key: string): boolean;
}

/** Keyboard steps: 6 degrees per arrow press, 10% closer or further per +/-. */
const KEY_ROTATE = MathUtils.degToRad(6);
const KEY_DOLLY = 1.1;

export function createCameraRig(element: HTMLElement): CameraRig {
  // A 40 degree lens, roughly a 50 mm on full frame: how cars get photographed.
  const camera = new PerspectiveCamera(40, 1, 0.05, 60);
  camera.position.copy(START_POSITION);

  const controls = new OrbitControls(camera, element);
  controls.target.copy(BAY_TARGET);
  // Heavy damping: the view moves like a camera on a dolly, not a feather.
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.enablePan = false;
  controls.minDistance = 2.4;
  controls.maxDistance = 8.5;
  controls.minPolarAngle = MathUtils.degToRad(12);
  controls.maxPolarAngle = MathUtils.degToRad(88);
  controls.update();

  const offset = new Vector3();
  const spherical = new Spherical();
  const before = new Vector3();

  return {
    camera,
    controls,
    update() {
      before.copy(camera.position);
      const moved = controls.update();
      clampToRoom(camera.position);
      return moved || before.distanceToSquared(camera.position) > 1e-10;
    },
    handleKey(key) {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      switch (key) {
        case 'ArrowLeft':
          spherical.theta -= KEY_ROTATE;
          break;
        case 'ArrowRight':
          spherical.theta += KEY_ROTATE;
          break;
        case 'ArrowUp':
          spherical.phi -= KEY_ROTATE;
          break;
        case 'ArrowDown':
          spherical.phi += KEY_ROTATE;
          break;
        case '+':
        case '=':
        case 'PageUp':
          spherical.radius /= KEY_DOLLY;
          break;
        case '-':
        case 'PageDown':
          spherical.radius *= KEY_DOLLY;
          break;
        default:
          return false;
      }
      spherical.phi = MathUtils.clamp(
        spherical.phi,
        controls.minPolarAngle,
        controls.maxPolarAngle,
      );
      spherical.radius = MathUtils.clamp(
        spherical.radius,
        controls.minDistance,
        controls.maxDistance,
      );
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
      clampToRoom(camera.position);
      controls.update();
      return true;
    },
    resize(width, height) {
      camera.aspect = width / Math.max(height, 1);
      // On a tall phone screen, widen the lens so the bay still fits.
      camera.fov = camera.aspect < 0.8 ? 58 : 40;
      camera.updateProjectionMatrix();
    },
  };
}
