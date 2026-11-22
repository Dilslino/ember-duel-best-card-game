// audio.js — all sound is synthesized with WebAudio: no audio files, no network.
// Short oscillator blips: a card snap, a hit thud, a heal shimmer, a win fanfare.

let ctx = null;
let muted = false;

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

function audioContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const t = ac.currentTime + when;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function playCardSound() { tone(660, 0.09, 'triangle', 0.14); tone(880, 0.08, 'triangle', 0.1, 0.05); }
export function playDamageSound() { tone(140, 0.22, 'sawtooth', 0.16); tone(90, 0.28, 'square', 0.1, 0.03); }
export function playShieldSound() { tone(420, 0.14, 'sine', 0.12); tone(560, 0.16, 'sine', 0.1, 0.06); }
export function playHealSound() { tone(520, 0.12, 'sine', 0.1); tone(780, 0.18, 'sine', 0.1, 0.08); }
export function playSurgeSound() { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.14, 0.07); tone(784, 0.16, 'triangle', 0.16, 0.14); }
export function playTurnSound() { tone(440, 0.08, 'triangle', 0.1); }
export function playWinSound() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.12)); }
export function playLoseSound() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'sawtooth', 0.1, i * 0.14)); }
export function playClickSound() { tone(500, 0.05, 'triangle', 0.08); }
