// GILDED HOUR — keyboard and mouse input.
// WASD or arrows move, Shift sneaks, Q drops smoke, E fires the EMP,
// M mutes, Enter or a click starts the game and confirms screens.

const MOVE_KEYS = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

/** Fresh input state: held directions plus edge-triggered presses. */
export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    pressed: new Set(),
    clicked: false,
    clickX: 0,
    clickY: 0,
  };
}

/** Wire the page's keyboard and mouse into an input state. */
export function bindInput(input, element) {
  window.addEventListener('keydown', (event) => {
    const dir = MOVE_KEYS[event.code];
    if (dir) {
      input[dir] = true;
      event.preventDefault();
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sneak = true;
    if (event.code === 'Enter' || event.code === 'Space') input.pressed.add('confirm');
    if (event.code === 'KeyQ') input.pressed.add('smoke');
    if (event.code === 'KeyE') input.pressed.add('emp');
    if (event.code === 'KeyM') input.pressed.add('mute');
  });
  window.addEventListener('keyup', (event) => {
    const dir = MOVE_KEYS[event.code];
    if (dir) input[dir] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sneak = false;
  });
  element.addEventListener('mousedown', (event) => {
    const rect = element.getBoundingClientRect();
    input.clicked = true;
    input.clickX = (event.clientX - rect.left) * (element.width / rect.width);
    input.clickY = (event.clientY - rect.top) * (element.height / rect.height);
  });
}

/** A movement vector from the held keys, normalized to length 1. */
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  if (input.up) y -= 1;
  if (input.down) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

/** Clear the edge-triggered presses after a frame has consumed them. */
export function endFrameInput(input) {
  input.pressed.clear();
  input.clicked = false;
}
