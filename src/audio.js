import { persist, save } from './save.js';
import { $ } from './dom.js';
// ---------- Sound ----------
let actx = null;
function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
  return actx;
}
function blip(freqs, dur, type, vol) {
  const a = audio(); if (!a) return;
  const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freqs[0], t);
  freqs.forEach((f, i) => { if (i > 0) o.frequency.linearRampToValueAtTime(f, t + (dur * i) / (freqs.length - 1)); });
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
function meowSound(base) {
  const a = audio(); if (!a) return;
  const t = a.currentTime, o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(2200, t + 0.15); f.frequency.linearRampToValueAtTime(700, t + 0.45); f.Q.value = 6;
  o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * 1.4, t + 0.14); o.frequency.linearRampToValueAtTime(base * 0.78, t + 0.45);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.55);
}


// ---------- Music: a slow generated lullaby ----------
const music = { on: save.music !== false, timer: null, next: 0, step: 0, bus: null };
const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
const MELODY = [72, 74, 76, 79, 81, 84];
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function tone(t, freq, dur, type, vol, attack) {
  const a = actx, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(music.bus); o.start(t); o.stop(t + dur + 0.05);
}
function musicStep(t, s) {
  const chord = CHORDS[Math.floor(s / 16) % CHORDS.length];
  if (s % 16 === 0) chord.forEach(n => tone(t, hz(n), 6.2, 'triangle', 0.022, 1.2));
  if (s % 8 === 0) tone(t, hz(chord[0] - 12), 2.4, 'sine', 0.05, 0.05);
  if (s % 2 === 0 && Math.random() < 0.55) tone(t, hz(MELODY[Math.floor(Math.random() * MELODY.length)]), 1.1, 'sine', 0.03, 0.01);
}
function startMusic() {
  const a = audio(); if (!a || music.timer) return;
  music.bus = a.createGain(); music.bus.gain.value = music.on ? 0.8 : 0.0001;
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
  music.bus.connect(lp); lp.connect(a.destination);
  music.next = a.currentTime + 0.2;
  music.timer = setInterval(() => {
    if (!actx || actx.state !== 'running') return;
    while (music.next < actx.currentTime + 0.5) { musicStep(music.next, music.step); music.next += 0.4; music.step++; }
    if (music.next < actx.currentTime) music.next = actx.currentTime + 0.1;
  }, 150);
}
function toggleMusic() {
  music.on = !music.on; save.music = music.on; persist();
  startMusic();
  if (music.bus && actx) { music.bus.gain.cancelScheduledValues(actx.currentTime); music.bus.gain.setTargetAtTime(music.on ? 0.8 : 0.0001, actx.currentTime, 0.3); }
  const label = 'Music: ' + (music.on ? 'on' : 'off');
  $('pauseMusic').textContent = label;
}

export { actx, audio, blip, meowSound, music, CHORDS, MELODY, hz, tone, musicStep, startMusic, toggleMusic };
