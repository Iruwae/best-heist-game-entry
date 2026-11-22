// GILDED HOUR — the museum floor: solidity and line of sight.
// Walls and cover block both movement and vision; floors and doorways do not.

import { COLS, ROWS, TILE, WALL, CASE, CRATE, STATUE } from './config.js';

const SOLID_KINDS = new Set([WALL, CASE, CRATE, STATUE]);

/** Whether the tile at (tx, ty) blocks movement and sight. */
export function isSolidTile(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return SOLID_KINDS.has(grid[ty][tx]);
}

/** Whether the pixel point (x, y) sits inside a solid tile. */
export function isSolidPoint(grid, x, y) {
  return isSolidTile(grid, Math.floor(x / TILE), Math.floor(y / TILE));
}

/**
 * Whether a circle of radius r at (x, y) overlaps any solid tile.
 * Used to keep the thief and the guards out of walls and cover.
 */
export function circleHitsSolid(grid, x, y, r) {
  const x0 = Math.floor((x - r) / TILE);
  const x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE);
  const y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolidTile(grid, tx, ty)) continue;
      const nearestX = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const nearestY = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      const dx = x - nearestX;
      const dy = y - nearestY;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

/**
 * Whether a watcher at (x1, y1) can see a target at (x2, y2): sample the
 * segment every few pixels and fail on the first solid tile in the way.
 * Smoke clouds also break sight; the caller checks those separately.
 */
export function hasLineOfSight(grid, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolidPoint(grid, x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}
