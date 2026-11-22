// GILDED HOUR — synthesized sound. No audio files: every sound is an
// oscillator through the Web Audio API, built on the first user gesture.

let context = null;
let master = null;
let muted = false;

/** Create the audio context on first use (browsers need a gesture). */
export function ensureAudio() {
  if (context !== null) {
    if (context.state === 'suspended') context.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    context = new Ctor();
    master = context.createGain();
    master.gain.value = 0.25;
    master.connect(context.destination);
  } catch {
    context = null;
  }
}

/** Toggle the mute; returns the new muted state. */
export function toggleMute() {
  muted = !muted;
  if (master !== null) master.gain.value = muted ? 0 : 0.25;
  return muted;
}

/** One short tone: frequency slide, gain envelope, then silence. */
function tone(freqFrom, freqTo, seconds, type, volume) {
  if (context === null || master === null || muted) return;
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), now + seconds);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

/** A coin picked up: a bright two-note tick. */
export function playCoin() {
  tone(980, 980, 0.07, 'sine', 0.5);
  setTimeout(() => tone(1320, 1320, 0.09, 'sine', 0.5), 60);
}

/** A piece of loot pocketed: a rising chime. */
export function playLoot() {
  tone(523, 523, 0.1, 'triangle', 0.6);
  setTimeout(() => tone(659, 659, 0.1, 'triangle', 0.6), 90);
  setTimeout(() => tone(784, 784, 0.16, 'triangle', 0.6), 180);
}

/** The alarm ticking while the thief is seen: faster as the meter climbs. */
export function playAlarmTick(alarm) {
  const freq = 300 + alarm * 6;
  tone(freq, freq * 0.9, 0.06, 'square', 0.18);
}

/** Caught: a low falling sting. */
export function playCaught() {
  tone(320, 90, 0.5, 'sawtooth', 0.5);
  tone(160, 60, 0.6, 'square', 0.3);
}

/** The getaway: a short winning arpeggio. */
export function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => tone(freq, freq, 0.22, 'triangle', 0.55), i * 110);
  });
}

/** A tool fired: a soft whoosh. */
export function playTool() {
  tone(900, 240, 0.18, 'sine', 0.4);
}

/** A tool refused: a dull thud. */
export function playDenied() {
  tone(140, 90, 0.12, 'square', 0.3);
}

/** A button or confirm press. */
export function playClick() {
  tone(660, 660, 0.05, 'sine', 0.4);
}
