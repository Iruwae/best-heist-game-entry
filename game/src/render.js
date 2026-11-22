// GILDED HOUR — every pixel on the canvas: the night museum, the cones,
// the thief, the loot, the alarm, and the screens between heists.
// Safe cover is dark indigo, danger is amber and red, loot is gold —
// readable at a glance, even shrunk to a contact sheet.

import { COLS, ROWS, TILE, VIEW_W, VIEW_H, WALL, CASE, CRATE, STATUE, TUNE } from './config.js';
import { laserBeamY } from './lasers.js';

const HUD_H = 46;
const GOLD = '#e8b64c';
const AMBER = 'rgba(255, 176, 32, 0.20)';
const AMBER_EDGE = 'rgba(255, 176, 32, 0.55)';
const RED = 'rgba(255, 64, 64, 0.22)';
const RED_EDGE = 'rgba(255, 64, 64, 0.6)';

/** A vision cone: a filled wedge with a brighter edge, from (x, y). */
function drawCone(ctx, x, y, angle, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

/** The marble floor: two dark blues in a checker, plus a gold inlay border.
 *  A deep-red carpet runs up the middle gallery from the van door, so the
 *  entrance reads as a museum at a glance. */
function drawFloor(ctx) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#1d2742' : '#1a2338';
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  ctx.fillStyle = 'rgba(122, 28, 38, 0.55)';
  ctx.fillRect(19 * TILE, TILE, 2 * TILE, (ROWS - 2) * TILE);
  ctx.strokeStyle = 'rgba(232, 182, 76, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(19 * TILE + 3, TILE);
  ctx.lineTo(19 * TILE + 3, (ROWS - 1) * TILE);
  ctx.moveTo(21 * TILE - 3, TILE);
  ctx.lineTo(21 * TILE - 3, (ROWS - 1) * TILE);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232, 182, 76, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(TILE, TILE, VIEW_W - TILE * 2, VIEW_H - TILE * 2);
}

/** Framed paintings on the north and south walls: the museum, not a grid. */
const PAINTINGS = [
  { x: 5, y: 0, hue: '#7a2e2e' }, { x: 10, y: 0, hue: '#2e5a7a' }, { x: 16, y: 0, hue: '#7a6a2e' },
  { x: 23, y: 0, hue: '#2e7a4a' }, { x: 30, y: 0, hue: '#5a2e7a' }, { x: 35, y: 0, hue: '#7a2e2e' },
  { x: 5, y: 24, hue: '#2e5a7a' }, { x: 10, y: 24, hue: '#7a6a2e' },
  { x: 29, y: 24, hue: '#2e7a4a' }, { x: 34, y: 24, hue: '#5a2e7a' },
];

function drawPaintings(ctx) {
  for (const painting of PAINTINGS) {
    const x = painting.x * TILE + 3;
    const y = painting.y * TILE + 3;
    ctx.fillStyle = GOLD;
    ctx.fillRect(x, y, TILE - 6, TILE - 6);
    ctx.fillStyle = painting.hue;
    ctx.fillRect(x + 3, y + 3, TILE - 12, TILE - 12);
    ctx.fillStyle = 'rgba(255, 240, 200, 0.5)';
    ctx.fillRect(x + 5, y + 6, TILE - 16, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 3, y + TILE - 10, TILE - 12, 7);
  }
}

/** Walls in brass, cover in glass, wood and stone. */
function drawWallsAndCover(ctx, grid) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const kind = grid[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (kind === WALL) {
        ctx.fillStyle = '#6b5322';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#8a6d2f';
        ctx.fillRect(x, y, TILE, 6);
      } else if (kind === CASE) {
        ctx.fillStyle = '#2c4a6b';
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = 'rgba(160, 210, 255, 0.35)';
        ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      } else if (kind === CRATE) {
        ctx.fillStyle = '#5a3d22';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = '#7a5630';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.stroke();
      } else if (kind === STATUE) {
        ctx.fillStyle = '#7d8590';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aab2bd';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 - 3, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** The three pieces to steal: gold diamonds that sparkle, with labels. */
function drawLoot(ctx, loot, nowSeconds) {
  for (const piece of loot) {
    if (piece.taken) continue;
    const pulse = 0.7 + 0.3 * Math.sin(nowSeconds * 3 + piece.x);
    const cx = piece.x;
    const cy = piece.y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = `rgba(232, 182, 76, ${pulse})`;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeStyle = '#fff2c4';
    ctx.lineWidth = 2;
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.restore();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(piece.name.toUpperCase(), cx, cy + 26);
  }
}

/** Loose coins: small gold discs. */
function drawCoins(ctx, coins) {
  for (const coin of coins) {
    if (coin.taken) continue;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5a16';
    ctx.font = 'bold 8px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('¢', coin.x, coin.y + 3);
  }
}

/** The getaway door: locked grey until every piece is stolen, then green. */
function drawExit(ctx, state) {
  const open = state.loot.every((piece) => piece.taken);
  for (const tile of state.exitTiles) {
    const x = tile.x * TILE;
    const y = tile.y * TILE;
    ctx.fillStyle = open ? '#1f7a4d' : '#3a3f4a';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = open ? '#5be3a0' : '#8a8f9a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
  }
  if (open) {
    ctx.fillStyle = '#5be3a0';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY', (state.exitTiles[0].x + 0.5) * TILE + TILE / 2 - 16, (state.exitTiles[0].y - 0.4) * TILE);
  }
}

/** Cameras: wall mounts plus their red sweeping cones. */
function drawCameras(ctx, cameras, nowSeconds) {
  for (const camera of cameras) {
    const disabled = nowSeconds < camera.disabledUntil;
    if (!disabled) {
      drawCone(ctx, camera.x, camera.y, camera.angle, TUNE.cameraHalfAngle, TUNE.cameraRange, RED, RED_EDGE);
    }
    ctx.fillStyle = disabled ? '#5a5f6a' : '#c22';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (disabled) {
      ctx.fillStyle = '#ffd94c';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP', camera.x, camera.y - 14);
    }
  }
}

/** Guards: navy wardens with amber cones and a "!" while they see you. */
function drawGuards(ctx, guards) {
  for (const guard of guards) {
    drawCone(ctx, guard.x, guard.y, guard.angle, TUNE.guardHalfAngle, TUNE.guardRange, AMBER, AMBER_EDGE);
  }
  for (const guard of guards) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(guard.x, guard.y + 9, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c3a5e';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8fa3d9';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.angle) * 6, guard.y + Math.sin(guard.angle) * 6, 4, 0, Math.PI * 2);
    ctx.fill();
    if (guard.suspicious) {
      ctx.fillStyle = '#ffcf3d';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 18);
    }
  }
}

/** Marlowe, the thief: a dark figure with a gold ring, facing its heading.
 *  A soft gold halo keeps Marlowe visible against the dark floor, even
 *  shrunk to a contact sheet. */
function drawThief(ctx, thief) {
  const halo = ctx.createRadialGradient(thief.x, thief.y, 4, thief.x, thief.y, 32);
  halo.addColorStop(0, 'rgba(232, 182, 76, 0.38)');
  halo.addColorStop(1, 'rgba(232, 182, 76, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14161f';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(thief.x + Math.cos(thief.angle) * 7, thief.y + Math.sin(thief.angle) * 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (thief.sneaking) {
    ctx.fillStyle = '#9fb4ff';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', thief.x, thief.y - 18);
  }
}

/** Laser grids: bright red beams sweeping the middle gallery, with
 *  emitter boxes on both ends. A beam that touches Marlowe feeds the
 *  alarm — smoke hides you from eyes, not from light. */
function drawLasers(ctx, lasers, nowSeconds) {
  for (const laser of lasers) {
    const y = laserBeamY(laser, nowSeconds);
    // Wide glow, then a hot core: readable even on a contact sheet.
    ctx.strokeStyle = 'rgba(255, 45, 45, 0.28)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(laser.x0, y);
    ctx.lineTo(laser.x1, y);
    ctx.stroke();
    ctx.strokeStyle = '#ff2d2d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(laser.x0, y);
    ctx.lineTo(laser.x1, y);
    ctx.stroke();
    ctx.strokeStyle = '#ffb3b3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(laser.x0, y);
    ctx.lineTo(laser.x1, y);
    ctx.stroke();
    // Emitters on both ends.
    for (const ex of [laser.x0, laser.x1]) {
      ctx.fillStyle = '#7a1010';
      ctx.fillRect(ex - 5, y - 7, 10, 14);
      ctx.fillStyle = '#ff4040';
      ctx.beginPath();
      ctx.arc(ex, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Smoke clouds: soft grey discs that swallow vision cones. */
function drawSmoke(ctx, clouds, nowSeconds) {
  for (const cloud of clouds) {
    const age = nowSeconds - cloud.bornAt;
    const life = cloud.diesAt - cloud.bornAt;
    const alpha = 0.55 * Math.min(1, (life - age) / 1.5);
    ctx.fillStyle = `rgba(200, 200, 210, ${Math.max(0, alpha)})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(230, 230, 240, ${Math.max(0, alpha * 0.7)})`;
    ctx.beginPath();
    ctx.arc(cloud.x - 18, cloud.y - 8, cloud.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cloud.x + 16, cloud.y + 10, cloud.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The top bar: title, loot pips, alarm meter, coins, tools, clock. */
function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('GILDED HOUR', 14, 29);
  // Loot pips.
  const taken = state.loot.filter((piece) => piece.taken).length;
  for (let i = 0; i < 3; i++) {
    const x = 190 + i * 26;
    ctx.save();
    ctx.translate(x, 23);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = i < taken ? GOLD : 'rgba(232, 182, 76, 0.25)';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
  ctx.fillStyle = '#cfd6e4';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`LOOT ${taken}/3`, 275, 28);
  // Alarm meter.
  const alarm = state.alarm;
  const barX = 480;
  const barW = 320;
  ctx.fillStyle = '#20242e';
  ctx.fillRect(barX, 14, barW, 18);
  const alarmColor = alarm < 40 ? '#4caf6d' : alarm < 75 ? '#e8a13c' : '#e84c4c';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(barX, 14, (barW * alarm) / 100, 18);
  ctx.strokeStyle = '#8a8f9a';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, 14, barW, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.round(alarm)}%`, barX + barW + 10, 28);
  // Coins, tools, clock.
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`¢ ${state.coins}   SMOKE ${state.smoke} (Q)   EMP ${state.coins >= TUNE.empCost ? 'READY' : '3¢'} (E)`, 1130, 28);
  ctx.fillStyle = '#cfd6e4';
  ctx.fillText(formatTime(state.time), 1266, 28);
  // Objective line under the bar.
  ctx.fillStyle = 'rgba(207, 214, 228, 0.9)';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  const open = state.loot.every((piece) => piece.taken);
  ctx.fillText(
    open ? 'All three pieces stolen — reach the green GETAWAY door!' : 'Steal the Ledger, the Sapphire and the Key — then reach the van.',
    VIEW_W / 2,
    HUD_H + 20,
  );
  // Transient message.
  if (state.message !== '' && state.nowSeconds < state.messageUntil) {
    ctx.fillStyle = '#ffd94c';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(state.message, VIEW_W / 2, HUD_H + 46);
  }
}

/** mm:ss clock. */
function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Red edge pulse as the alarm climbs — tension you can see. */
function drawAlarmVignette(ctx, alarm) {
  if (alarm <= 40) return;
  const strength = (alarm - 40) / 60;
  const grad = ctx.createRadialGradient(
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35,
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75,
  );
  grad.addColorStop(0, 'rgba(232, 40, 40, 0)');
  grad.addColorStop(1, `rgba(232, 40, 40, ${0.35 * strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

/** Title screen over the museum: name, rules, and the promise of the heist. */
function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('GILDED HOUR', VIEW_W / 2, 250);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('One night. Three galleries. Three pieces. One getaway.', VIEW_W / 2, 292);
  ctx.fillStyle = '#cfd6e4';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('WASD / arrows — move      Shift — sneak      Q — smoke (2¢)      E — EMP, cameras out (3¢)', VIEW_W / 2, 360);
  ctx.fillText('Dodge the amber cones of the wardens and the red sweeps of the cameras.', VIEW_W / 2, 392);
  ctx.fillText('Laser grids sweep the middle gallery — cross between sweeps. Smoke hides you, not from light.', VIEW_W / 2, 420);
  ctx.fillText('When the alarm fills, the wardens reset the room — and the clock keeps its penalty.', VIEW_W / 2, 448);
  ctx.fillStyle = '#ffd94c';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press ENTER or click to begin the heist', VIEW_W / 2, 480);
  ctx.fillStyle = '#9aa3b5';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('4 wardens · 3 cameras · 2 laser grids · 3 relics · 6 coins · smoke + EMP.', VIEW_W / 2, 540);
  drawHud(ctx, state);
}

/** The caught moment: a fair freeze, then the room resets. */
function drawCaught(ctx, state) {
  ctx.fillStyle = 'rgba(120, 10, 10, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ff5b5b';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPOTTED!', VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('The wardens reset the room. The clock keeps +30s.', VIEW_W / 2, VIEW_H / 2 + 34);
  drawHud(ctx, state);
}

/** The getaway: time, loot, and whether the run stayed clean. */
function drawWin(ctx, state) {
  ctx.fillStyle = 'rgba(6, 12, 8, 0.85)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = state.caughtCount === 0 ? GOLD : '#5be3a0';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.caughtCount === 0 ? 'CLEAN GETAWAY!' : 'GETAWAY!', VIEW_W / 2, 280);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`Time ${formatTime(state.time)}   •   Loot 3/3   •   Coins left ${state.coins}`, VIEW_W / 2, 330);
  ctx.fillText(
    state.caughtCount === 0
      ? 'Never once seen. The museum never knew Marlowe was there.'
      : `Spotted ${state.caughtCount} ${state.caughtCount === 1 ? 'time' : 'times'} — the ledger still left with Marlowe.`,
    VIEW_W / 2,
    364,
  );
  ctx.fillStyle = '#ffd94c';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('Press ENTER or click to run it again', VIEW_W / 2, 430);
  drawHud(ctx, state);
}

/** Draw one frame of the game for the given state. */
export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawWallsAndCover(ctx, state.grid);
  drawPaintings(ctx);
  drawExit(ctx, state);
  drawLoot(ctx, state.loot, state.nowSeconds);
  drawCoins(ctx, state.coinSpots);
  drawCameras(ctx, state.cameras, state.nowSeconds);
  drawLasers(ctx, state.lasers, state.nowSeconds);
  drawGuards(ctx, state.guards);
  drawSmoke(ctx, state.smokeClouds, state.nowSeconds);
  drawThief(ctx, state.thief);
  drawAlarmVignette(ctx, state.alarm);
  if (state.screen === 'title') {
    drawTitle(ctx, state);
  } else if (state.screen === 'caught') {
    drawCaught(ctx, state);
  } else if (state.screen === 'win') {
    drawWin(ctx, state);
  } else {
    drawHud(ctx, state);
  }
}
