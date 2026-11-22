// GILDED HOUR — the game loop and the heist itself.
// Marlowe crosses the museum, steals three pieces, and reaches the van.
// States: title, playing, caught (a fair freeze, then the room resets),
// win, and staged (a frozen frame for the screenshots).

import {
  TILE, VIEW_W, VIEW_H, ROWS,
  LOOT_SPOTS, COIN_SPOTS, ENTRY_TILE, EXIT_TILES,
  GUARD_PATROLS, CAMERA_MOUNTS, TUNE, buildLevel, tileCenter,
} from './config.js';
import { circleHitsSolid } from './world.js';
import { makeGuard, updateGuard, guardAlarmRate } from './guards.js';
import { makeCamera, updateCamera, cameraAlarmRate, disableAllCameras } from './cameras.js';
import { useSmoke, useEmp, pruneSmoke } from './tools.js';
import { makeInput, bindInput, moveVector, endFrameInput } from './input.js';
import {
  ensureAudio, toggleMute,
  playCoin, playLoot, playAlarmTick, playCaught, playWin, playTool, playDenied, playClick,
} from './audio.js';
import { drawGame } from './render.js';

const THIEF_RADIUS = 12;

/** Fresh run state: a new heist from the south door. */
function freshState() {
  const grid = buildLevel();
  const entry = tileCenter(ENTRY_TILE.x, ENTRY_TILE.y);
  return {
    grid,
    guards: GUARD_PATROLS.map((def, i) => makeGuard(def, i)),
    cameras: CAMERA_MOUNTS.map((mount, i) => makeCamera(mount, i)),
    loot: LOOT_SPOTS.map((spot) => {
      const pos = tileCenter(spot.x, spot.y);
      return { id: spot.id, name: spot.name, x: pos.x, y: pos.y, taken: false };
    }),
    coinSpots: COIN_SPOTS.map((spot) => {
      const pos = tileCenter(spot.x, spot.y);
      return { x: pos.x, y: pos.y, taken: false };
    }),
    exitTiles: EXIT_TILES,
    thief: { x: entry.x, y: entry.y, angle: -Math.PI / 2, sneaking: false },
    alarm: 0,
    coins: 0,
    smoke: 1,
    smokeClouds: [],
    time: 0,
    caughtCount: 0,
    screen: 'title',
    message: '',
    messageUntil: 0,
    nowSeconds: 0,
    caughtUntil: 0,
    lastAlarmTick: 0,
  };
}

/** Put the thief back at the door and the wardens on their posts. */
function resetRoom(state) {
  const entry = tileCenter(ENTRY_TILE.x, ENTRY_TILE.y);
  state.thief.x = entry.x;
  state.thief.y = entry.y;
  state.thief.angle = -Math.PI / 2;
  state.guards = GUARD_PATROLS.map((def, i) => makeGuard(def, i));
  state.alarm = 0;
  state.smokeClouds = [];
  state.screen = 'playing';
}

/** Flash a short message under the HUD. */
function say(state, text, seconds) {
  state.message = text;
  state.messageUntil = state.nowSeconds + seconds;
}

/** Move the thief with axis-separated collision, so walls slide. */
function moveThief(state, dt, input) {
  const vector = moveVector(input);
  const speed = input.sneak ? TUNE.sneakSpeed : TUNE.thiefSpeed;
  state.thief.sneaking = input.sneak && (vector.x !== 0 || vector.y !== 0);
  if (vector.x === 0 && vector.y === 0) return;
  const nx = state.thief.x + vector.x * speed * dt;
  if (!circleHitsSolid(state.grid, nx, state.thief.y, THIEF_RADIUS)) state.thief.x = nx;
  const ny = state.thief.y + vector.y * speed * dt;
  if (!circleHitsSolid(state.grid, state.thief.x, ny, THIEF_RADIUS)) state.thief.y = ny;
  const want = Math.atan2(vector.y, vector.x);
  let d = want - state.thief.angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  state.thief.angle += d * Math.min(1, dt * 10);
}

/** Pick up loot and coins the thief walks over. */
function collectPickups(state) {
  for (const piece of state.loot) {
    if (piece.taken) continue;
    if (Math.hypot(state.thief.x - piece.x, state.thief.y - piece.y) < 26) {
      piece.taken = true;
      playLoot();
      say(state, `Stolen: the ${piece.name}!`, 2.5);
    }
  }
  for (const coin of state.coinSpots) {
    if (coin.taken) continue;
    if (Math.hypot(state.thief.x - coin.x, state.thief.y - coin.y) < 22) {
      coin.taken = true;
      state.coins += 1;
      playCoin();
    }
  }
}

/** The getaway door opens once every piece is stolen. */
function atExit(state) {
  if (!state.loot.every((piece) => piece.taken)) return false;
  const inDoorX = state.thief.x >= EXIT_TILES[0].x * TILE && state.thief.x < (EXIT_TILES[1].x + 1) * TILE;
  return inDoorX && state.thief.y > (ROWS - 1) * TILE - 14;
}

/** One frame of the heist while playing. */
function updatePlaying(state, input, dt) {
  state.time += dt;
  moveThief(state, dt, input);
  for (const guard of state.guards) updateGuard(guard, state.grid, dt);
  for (const camera of state.cameras) updateCamera(camera, state.nowSeconds);
  pruneSmoke(state.smokeClouds, state.nowSeconds);
  collectPickups(state);

  // Detection: every cone that sees the thief feeds the alarm.
  let rate = 0;
  for (const guard of state.guards) rate += guardAlarmRate(guard, state.grid, state.thief, state.smokeClouds);
  for (const camera of state.cameras) {
    rate += cameraAlarmRate(camera, state.grid, state.thief, state.smokeClouds, state.nowSeconds);
  }
  if (rate > 0) {
    state.alarm = Math.min(TUNE.alarmCaughtAt, state.alarm + rate * dt);
    if (state.nowSeconds - state.lastAlarmTick > 0.45) {
      state.lastAlarmTick = state.nowSeconds;
      playAlarmTick(state.alarm);
    }
  } else {
    state.alarm = Math.max(0, state.alarm - TUNE.alarmDecay * dt);
  }

  // Tools.
  if (input.pressed.has('smoke')) {
    const result = useSmoke(state, state.nowSeconds);
    if (result === 'broke') {
      playDenied();
      say(state, 'No smoke — need 2 coins.', 2);
    } else {
      playTool();
      say(state, result === 'bought' ? 'Smoke bought with 2 coins.' : 'Smoke out!', 1.5);
    }
  }
  if (input.pressed.has('emp')) {
    const result = useEmp(state);
    if (result === 'broke') {
      playDenied();
      say(state, 'EMP needs 3 coins.', 2);
    } else {
      disableAllCameras(state.cameras, state.nowSeconds);
      playTool();
      say(state, 'EMP fired — cameras dark!', 2);
    }
  }
  if (input.pressed.has('mute')) toggleMute();

  // Caught: a fair freeze, then the room resets and the clock keeps +30s.
  if (state.alarm >= TUNE.alarmCaughtAt) {
    state.caughtCount += 1;
    state.time += TUNE.caughtPenaltySeconds;
    state.screen = 'caught';
    state.caughtUntil = state.nowSeconds + 1.6;
    playCaught();
    return;
  }
  if (atExit(state)) {
    state.screen = 'win';
    playWin();
  }
}

/** Stage a frozen frame for the screenshots: ?scene=cover|mid|getaway|win|title. */
function applyScene(state, scene) {
  const placeThief = (tx, ty, angle) => {
    const pos = tileCenter(tx, ty);
    state.thief.x = pos.x;
    state.thief.y = pos.y;
    state.thief.angle = angle;
  };
  const setGuardPose = (index, tx, ty, angle, suspicious) => {
    const pos = tileCenter(tx, ty);
    const guard = state.guards[index];
    guard.x = pos.x;
    guard.y = pos.y;
    guard.angle = angle;
    guard.suspicious = suspicious;
  };
  const setCameraPose = (index, angle) => {
    state.cameras[index].angle = angle;
  };
  if (scene === 'cover') {
    state.screen = 'staged';
    state.time = 72;
    state.alarm = 34;
    state.coins = 2;
    state.smoke = 1;
    state.loot[0].taken = true;
    placeThief(20, 15, -Math.PI / 2);
    setGuardPose(0, 8, 10, Math.PI / 2, false);
    setGuardPose(1, 19, 9, Math.PI / 2, true);
    setGuardPose(2, 32, 10, -Math.PI / 2, false);
    setGuardPose(3, 19, 18, 0, false);
    setCameraPose(0, Math.PI / 2 + 0.4);
    setCameraPose(1, Math.PI);
    setCameraPose(2, Math.PI / 2 - 0.3);
  } else if (scene === 'mid') {
    state.screen = 'staged';
    state.time = 148;
    state.alarm = 58;
    state.coins = 3;
    state.smoke = 0;
    state.loot[0].taken = true;
    state.loot[1].taken = true;
    state.thief.sneaking = true;
    placeThief(18, 17, Math.PI);
    // The smoke pellet just went off at Marlowe's feet: the tool, visible.
    state.smokeClouds.push({ x: 18 * TILE + TILE / 2, y: 17 * TILE + TILE / 2, radius: TUNE.smokeRadius, bornAt: 2.4, diesAt: 2.4 + TUNE.smokeSeconds });
    setGuardPose(0, 9, 15, 0, false);
    setGuardPose(1, 21, 14, Math.PI, true);
    setGuardPose(2, 31, 12, Math.PI / 2, false);
    setGuardPose(3, 19, 7, Math.PI / 2, false);
    setCameraPose(0, Math.PI / 2 - 0.5);
    setCameraPose(1, Math.PI + 0.3);
    setCameraPose(2, Math.PI / 2);
  } else if (scene === 'getaway') {
    state.screen = 'staged';
    state.time = 221;
    // Near-miss, not a stroll: alarm high, a warden suspicious with his
    // cone sweeping down the carpet straight at Marlowe by the door.
    state.alarm = 68;
    state.coins = 4;
    state.smoke = 1;
    for (const piece of state.loot) piece.taken = true;
    state.thief.sneaking = true;
    placeThief(19, 21, Math.PI / 2);
    setGuardPose(0, 6, 12, -Math.PI / 2, false);
    setGuardPose(1, 22, 8, Math.PI, false);
    setGuardPose(2, 33, 14, -Math.PI / 2, false);
    setGuardPose(3, 19, 10, Math.PI / 2, true);
    setCameraPose(0, Math.PI / 2 + 0.6);
    setCameraPose(1, Math.PI - 0.4);
    setCameraPose(2, Math.PI / 2 + 0.2);
  } else if (scene === 'win') {
    state.screen = 'win';
    state.time = 221;
    state.alarm = 0;
    state.coins = 4;
    state.caughtCount = 0;
    for (const piece of state.loot) piece.taken = true;
    placeThief(19, 22, Math.PI / 2);
  }
  // 'title' and anything else: the plain title screen.
}

/** Start the game in the browser. */
export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = makeInput();
  bindInput(input, canvas);
  const state = freshState();
  const params = new URLSearchParams(window.location.search);
  const scene = params.get('scene');
  if (scene !== null) applyScene(state, scene);
  window.__gilded = state;

  if (state.screen === 'staged' || state.screen === 'win') {
    // A frozen frame for the screenshots: draw once, no loop.
    state.nowSeconds = 2.4;
    drawGame(ctx, state);
    return state;
  }

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.nowSeconds += dt;
    if (input.pressed.has('mute')) toggleMute();
    if (state.screen === 'title') {
      if (input.pressed.has('confirm') || input.clicked) {
        ensureAudio();
        playClick();
        state.screen = 'playing';
      }
    } else if (state.screen === 'playing') {
      updatePlaying(state, input, dt);
    } else if (state.screen === 'caught') {
      if (state.nowSeconds >= state.caughtUntil) resetRoom(state);
    } else if (state.screen === 'win') {
      if (input.pressed.has('confirm') || input.clicked) {
        ensureAudio();
        playClick();
        const next = freshState();
        Object.assign(state, next);
        state.screen = 'playing';
      }
    }
    drawGame(ctx, state);
    endFrameInput(input);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return state;
}

// Boot when the page loads.
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (canvas !== null) startGame(canvas);
});
