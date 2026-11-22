// GILDED HOUR — the wall cameras: fixed mounts that sweep an arc.
// A camera watches a red cone that swings back and forth. It sees farther
// and raises the alarm faster than a guard, but it never moves — and an EMP
// charge knocks every camera out at once for a few seconds.

import { TUNE, tileCenter } from './config.js';
import { hasLineOfSight } from './world.js';

/** Make a camera from a mount definition. */
export function makeCamera(mount, index) {
  const pos = tileCenter(mount.x, mount.y);
  return {
    index,
    x: pos.x,
    y: pos.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep,
    speed: mount.speed,
    phase: index * 1.7,
    angle: mount.baseAngle,
    disabledUntil: 0,
  };
}

/** Swing one camera's cone; called every frame with the running clock. */
export function updateCamera(camera, nowSeconds) {
  camera.angle = camera.baseAngle + Math.sin(nowSeconds * camera.speed + camera.phase) * camera.sweep;
}

/** Whether this camera is dark right now (EMP). */
export function cameraDisabled(camera, nowSeconds) {
  return nowSeconds < camera.disabledUntil;
}

/** Smallest signed angle between two headings, in (-PI, PI]. */
function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * How fast this camera raises the alarm right now: 0 when disabled, when
 * the thief is out of its cone or range, hidden behind cover, or in smoke.
 */
export function cameraAlarmRate(camera, grid, thief, smokeClouds, nowSeconds) {
  if (cameraDisabled(camera, nowSeconds)) return 0;
  const dx = thief.x - camera.x;
  const dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > TUNE.cameraRange) return 0;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(toThief, camera.angle)) > TUNE.cameraHalfAngle) return 0;
  if (!hasLineOfSight(grid, camera.x, camera.y, thief.x, thief.y)) return 0;
  for (const cloud of smokeClouds) {
    if (Math.hypot(thief.x - cloud.x, thief.y - cloud.y) < cloud.radius) return 0;
  }
  const closeness = 1 - dist / TUNE.cameraRange;
  const rate = TUNE.cameraAlarmFar + (TUNE.cameraAlarmNear - TUNE.cameraAlarmFar) * closeness;
  return thief.sneaking ? rate * TUNE.sneakFactor : rate;
}

/** Knock every camera out for TUNE.empSeconds. */
export function disableAllCameras(cameras, nowSeconds) {
  for (const camera of cameras) camera.disabledUntil = nowSeconds + TUNE.empSeconds;
}
