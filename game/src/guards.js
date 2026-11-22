// GILDED HOUR — the wardens: patrol routes, vision cones, detection.
// A guard walks its waypoints ping-pong and watches a cone ahead of it.
// When the thief is inside the cone with a clear line of sight, the alarm
// climbs; the closer the thief, the faster it climbs.

import { TUNE, tileCenter } from './config.js';
import { circleHitsSolid, hasLineOfSight } from './world.js';

const GUARD_RADIUS = 13;

/** Make a guard from a patrol definition. */
export function makeGuard(def, index) {
  const start = tileCenter(def.waypoints[0][0], def.waypoints[0][1]);
  return {
    name: def.name,
    index,
    x: start.x,
    y: start.y,
    angle: Math.PI / 2,
    waypointIndex: 1,
    waypointDir: 1,
    waypoints: def.waypoints,
    speed: TUNE.guardSpeed,
    suspicious: false,
  };
}

/** Smallest signed angle between two headings, in (-PI, PI]. */
function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Walk one guard along its patrol; called every frame. */
export function updateGuard(guard, grid, dt) {
  const target = guard.waypoints[guard.waypointIndex];
  const dest = tileCenter(target[0], target[1]);
  const dx = dest.x - guard.x;
  const dy = dest.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) {
    guard.waypointIndex += guard.waypointDir;
    if (guard.waypointIndex >= guard.waypoints.length) {
      guard.waypointIndex = guard.waypoints.length - 2;
      guard.waypointDir = -1;
    } else if (guard.waypointIndex < 0) {
      guard.waypointIndex = 1;
      guard.waypointDir = 1;
    }
    return;
  }
  const step = Math.min(dist, guard.speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  if (!circleHitsSolid(grid, nx, ny, GUARD_RADIUS)) {
    guard.x = nx;
    guard.y = ny;
  }
  const want = Math.atan2(dy, dx);
  guard.angle += angleDelta(want, guard.angle) * Math.min(1, dt * 6);
}

/**
 * How fast this guard raises the alarm right now: 0 when the thief is out
 * of the cone, out of range, hidden behind cover, or inside a smoke cloud.
 * Returns the points-per-second rate and marks the guard suspicious.
 */
export function guardAlarmRate(guard, grid, thief, smokeClouds) {
  guard.suspicious = false;
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > TUNE.guardRange) return 0;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDelta(toThief, guard.angle)) > TUNE.guardHalfAngle) return 0;
  if (!hasLineOfSight(grid, guard.x, guard.y, thief.x, thief.y)) return 0;
  for (const cloud of smokeClouds) {
    if (Math.hypot(thief.x - cloud.x, thief.y - cloud.y) < cloud.radius) return 0;
    if (Math.hypot(guard.x - cloud.x, guard.y - cloud.y) < cloud.radius) return 0;
  }
  const closeness = 1 - dist / TUNE.guardRange;
  const rate = TUNE.guardAlarmFar + (TUNE.guardAlarmNear - TUNE.guardAlarmFar) * closeness;
  guard.suspicious = true;
  return thief.sneaking ? rate * TUNE.sneakFactor : rate;
}
