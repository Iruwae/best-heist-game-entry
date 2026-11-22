// GILDED HOUR — the laser grids.
// Two red beams sweep the middle gallery. Cross between sweeps: a beam
// that touches Marlowe feeds the alarm, and smoke does not block light.

import { TILE } from './config.js';

/** One sweeping beam: a horizontal line across the middle gallery. */
export function makeLaser(def, index) {
  return {
    x0: def.x0 * TILE,
    x1: def.x1 * TILE,
    baseRow: def.baseRow,
    ampTiles: def.ampTiles,
    speed: def.speed,
    phase: def.phase,
    index,
  };
}

/** Beam height in pixels at time t (seconds). */
export function laserBeamY(laser, t) {
  const row = laser.baseRow + laser.ampTiles * Math.sin(t * laser.speed + laser.phase);
  return row * TILE + TILE / 2;
}

/** Alarm per second while the thief stands in the beam. */
export function laserAlarmRate(laser, thief, t) {
  const y = laserBeamY(laser, t);
  if (thief.x < laser.x0 || thief.x > laser.x1) return 0;
  if (Math.abs(thief.y - y) > 12) return 0;
  return 2.0;
}
