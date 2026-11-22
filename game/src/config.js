// GILDED HOUR — level layout and tuning.
// One screen, one heist: a night museum in three galleries. The thief enters
// from the south van door, steals three pieces, and gets back out.

export const TILE = 32;
export const COLS = 40;
export const ROWS = 25;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 800

// Tile kinds inside the level grid.
export const FLOOR = 0;
export const WALL = 1;
export const CASE = 2; // display case: blocks movement and sight
export const CRATE = 3; // crate: blocks movement and sight
export const STATUE = 4; // statue: blocks movement and sight

// Doorways cut into each partition wall: two per wall, so every gallery
// has more than one route in and out.
const DOOR_ROWS = [5, 6, 18, 19];
const PARTITIONS = [13, 26];

// Cover pieces, each a rectangle of tiles: {x, y, w, h, kind}.
const COVER_PIECES = [
  { x: 4, y: 8, w: 2, h: 1, kind: CASE },
  { x: 8, y: 14, w: 2, h: 1, kind: CASE },
  { x: 3, y: 18, w: 1, h: 1, kind: CRATE },
  { x: 10, y: 10, w: 1, h: 1, kind: STATUE },
  { x: 17, y: 7, w: 2, h: 1, kind: CASE },
  { x: 22, y: 16, w: 2, h: 1, kind: CASE },
  { x: 15, y: 19, w: 1, h: 1, kind: CRATE },
  { x: 24, y: 9, w: 1, h: 1, kind: STATUE },
  { x: 30, y: 8, w: 2, h: 1, kind: CASE },
  { x: 34, y: 15, w: 2, h: 1, kind: CASE },
  { x: 28, y: 19, w: 1, h: 1, kind: CRATE },
  { x: 37, y: 10, w: 1, h: 1, kind: STATUE },
];

// The three pieces to steal, in tile coords.
export const LOOT_SPOTS = [
  { id: 'ledger', name: 'Gilded Ledger', x: 4, y: 3 },
  { id: 'sapphire', name: 'Star Sapphire', x: 20, y: 12 },
  { id: 'key', name: 'Brass Key', x: 34, y: 3 },
];

// Coins buy tools: a smoke pellet costs 2, an EMP charge costs 3.
export const COIN_SPOTS = [
  { x: 7, y: 20 },
  { x: 11, y: 6 },
  { x: 16, y: 21 },
  { x: 24, y: 4 },
  { x: 29, y: 12 },
  { x: 36, y: 20 },
];

// The thief starts just inside the south van door.
export const ENTRY_TILE = { x: 19, y: 22 };
// The getaway door, set into the south wall.
export const EXIT_TILES = [
  { x: 19, y: 24 },
  { x: 20, y: 24 },
];

// Guard patrols: waypoint lists in tile coords, walked ping-pong.
export const GUARD_PATROLS = [
  { name: 'Warden Ash', waypoints: [[3, 6], [10, 6], [10, 16], [3, 16]] },
  { name: 'Warden Bram', waypoints: [[16, 4], [24, 4], [24, 20], [16, 20]] },
  { name: 'Warden Cleo', waypoints: [[29, 6], [36, 6], [36, 16], [29, 16]] },
  { name: 'Warden Dov', waypoints: [[19, 5], [19, 12], [19, 19]] },
];

// Wall cameras: fixed mounts that sweep an arc.
export const CAMERA_MOUNTS = [
  { x: 20, y: 0, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55 },
  { x: 39, y: 12, baseAngle: Math.PI, sweep: 0.8, speed: 0.7 },
  { x: 6, y: 0, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.45 },
];

// Tuning: speeds in pixels per second, alarm in points per second.
export const TUNE = {
  thiefSpeed: 112,
  sneakSpeed: 56,
  guardSpeed: 54,
  guardRange: 175,
  guardHalfAngle: Math.PI / 4,
  guardAlarmNear: 1.9,
  guardAlarmFar: 0.85,
  cameraRange: 215,
  cameraHalfAngle: 0.7,
  cameraAlarmNear: 2.3,
  cameraAlarmFar: 1.2,
  sneakFactor: 0.5,
  alarmDecay: 7,
  alarmCaughtAt: 100,
  smokeRadius: 74,
  smokeSeconds: 5,
  smokeCost: 2,
  empSeconds: 6,
  empCost: 3,
  caughtPenaltySeconds: 30,
};

/** Build the level grid: border walls, two partitions with doorways, cover. */
export function buildLevel() {
  const grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid.push(new Array(COLS).fill(FLOOR));
  }
  for (let x = 0; x < COLS; x++) {
    grid[0][x] = WALL;
    grid[ROWS - 1][x] = WALL;
  }
  for (let y = 0; y < ROWS; y++) {
    grid[y][0] = WALL;
    grid[y][COLS - 1] = WALL;
  }
  for (const px of PARTITIONS) {
    for (let y = 1; y < ROWS - 1; y++) {
      if (!DOOR_ROWS.includes(y)) grid[y][px] = WALL;
    }
  }
  for (const piece of COVER_PIECES) {
    for (let dy = 0; dy < piece.h; dy++) {
      for (let dx = 0; dx < piece.w; dx++) {
        grid[piece.y + dy][piece.x + dx] = piece.kind;
      }
    }
  }
  return grid;
}

/** Pixel center of a tile. */
export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}
