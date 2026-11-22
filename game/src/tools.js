// GILDED HOUR — the thief's tools, bought with stolen coins.
// Smoke pellet (Q): drops a cloud at the thief's feet that blocks every
// vision cone for a few seconds. EMP charge (E): knocks every camera out
// for a few seconds. Both cost coins; a tool with no coins left flashes
// a warning instead of firing.

import { TUNE } from './config.js';

/** Drop a smoke cloud at (x, y) that lives TUNE.smokeSeconds. */
export function dropSmoke(clouds, x, y, nowSeconds) {
  clouds.push({
    x,
    y,
    radius: TUNE.smokeRadius,
    bornAt: nowSeconds,
    diesAt: nowSeconds + TUNE.smokeSeconds,
  });
}

/** Throw away clouds whose time is up. */
export function pruneSmoke(clouds, nowSeconds) {
  for (let i = clouds.length - 1; i >= 0; i--) {
    if (nowSeconds >= clouds[i].diesAt) clouds.splice(i, 1);
  }
}

/**
 * Try to use a smoke pellet. Returns 'used', 'bought' (auto-bought with
 * coins), or 'broke' (no pellet, not enough coins).
 */
export function useSmoke(state, nowSeconds) {
  if (state.smoke > 0) {
    state.smoke -= 1;
    dropSmoke(state.smokeClouds, state.thief.x, state.thief.y, nowSeconds);
    return 'used';
  }
  if (state.coins >= TUNE.smokeCost) {
    state.coins -= TUNE.smokeCost;
    dropSmoke(state.smokeClouds, state.thief.x, state.thief.y, nowSeconds);
    return 'bought';
  }
  return 'broke';
}

/**
 * Try to fire the EMP. Returns 'used' or 'broke' (not enough coins).
 * The caller disables the cameras on 'used'.
 */
export function useEmp(state) {
  if (state.coins >= TUNE.empCost) {
    state.coins -= TUNE.empCost;
    return 'used';
  }
  return 'broke';
}
