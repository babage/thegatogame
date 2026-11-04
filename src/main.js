import './style.css';
import { GAME_KEYS, NAV_NEXT, NAV_PREV, down, pollPads, pressed, readInputs } from './input.js';
import { audio, blip, meowSound, music, startMusic, toggleMusic } from './audio.js';
import { $, blessOverlay, canvas, chipsEl, napOverlay, objectiveEl, reduceMotion, roomLabel, titleOverlay, yarnEl, yarnLabel } from './dom.js';
import { BLESSINGS, persist, save } from './save.js';
import { G, JUMP_V, R, SPEED, advanceTime, cats, mods, setLevel } from './core.js';
import { attachModel, dressCats, resetCat } from './cats.js';
import { loadCatModel, modelAvailable } from './catModel.js';
import { MODEL } from './modelConfig.js';
import { addPhoto, photoURL, takePhoto } from './photos.js';
import { disposeLevel } from './levels/helpers.js';
import { ROOMS, updatePush } from './levels/index.js';
import { buildHome } from './levels/home.js';
import { CAM_DIR, M, camTarget, camera, hemi, renderer, scene, sun } from './scene.js';
import { moveAxis, solidsFor } from './physics.js';
import * as THREE from 'three';
import { level } from './core.js';
// ---------- Menus ----------
let state = 'title', menu = null, menuActed = false;
function openMenu(el, focusIdx) {
  el.hidden = false;
  const buttons = Array.from(el.querySelectorAll('button'));
  menu = { el, buttons, idx: Math.max(0, Math.min(buttons.length - 1, focusIdx || 0)) };
  menuFocus();
  down.clear(); pressed.clear();
}
function closeMenu() { if (menu) menu.el.hidden = true; menu = null; down.clear(); pressed.clear(); menuActed = true; }
function menuFocus() { if (!menu) return; const b = menu.buttons[menu.idx]; if (b && document.activeElement !== b) b.focus({ preventScroll: false }); }
function menuNav(d) { if (!menu || !menu.buttons.length) return; const cur = menu.buttons.indexOf(document.activeElement); if (cur >= 0) menu.idx = cur; menu.idx = (menu.idx + d + menu.buttons.length) % menu.buttons.length; menuFocus(); blip([500, 520], 0.05, 'sine', 0.03); }
function menuActivate() { if (!menu) return; const cur = menu.buttons.indexOf(document.activeElement); if (cur >= 0) menu.idx = cur; const b = menu.buttons[menu.idx]; if (b) b.click(); }


// ---------- Home ----------
const dreamFade = document.createElement('div'); dreamFade.className = 'dream-fade'; document.body.appendChild(dreamFade);
// Home is a room the cats walk around: coats, hats and the dream basket are all in it.
function openHub() {
  titleOverlay.hidden = true; napOverlay.hidden = true; blessOverlay.hidden = true;
  closeMenu();
  audio(); startMusic(); run = null; mods.jump = mods.speed = mods.magnet = mods.yarnMul = 1; renderChips();
  loadLevel('home');
  level.onDream = () => {
    // fade into the dream: the screen dims, the first room loads underneath, then it lifts
    blip([392, 523, 659, 784], 1.2, 'sine', 0.07);
    state = 'dreaming'; dreamFade.classList.add('on');
    setTimeout(() => { startRun(); dreamFade.classList.remove('on'); }, reduceMotion ? 0 : 700);
  };
  level.say = say;
  roomLabel.textContent = 'Home';
  state = 'home';
}
$('goHome').addEventListener('click', () => { closeMenu(); openHub(); });


// ---------- Pause ----------
let pausedFrom = 'play';
function openPause() {
  pausedFrom = state; state = 'pause';
  const atHome = pausedFrom === 'home';
  $('pauseRestart').hidden = atHome; $('pauseHome').hidden = atHome;
  $('pauseEyebrow').textContent = 'Paused · ' + (level ? level.name : '');
  $('pauseMusic').textContent = 'Music: ' + (music.on ? 'on' : 'off');
  openMenu($('pauseOverlay'), 0);
}
function resume() { closeMenu(); state = pausedFrom; }
$('resume').addEventListener('click', resume);
$('pauseRestart').addEventListener('click', () => { closeMenu(); restartRoom(); });
$('pauseHome').addEventListener('click', () => { closeMenu(); openHub(); });
$('pauseMusic').addEventListener('click', () => { toggleMusic(); });


// ---------- Run ----------
let run = null, roomYarn = 0;
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
function loadLevel(key) {
  if (level) { if (level.cleanup) level.cleanup(); disposeLevel(level); }
  setLevel(key === 'home' ? buildHome() : ROOMS[key]());
  const env = level.env;
  scene.background.set(env.bg); hemi.color.set(env.hemi); hemi.groundColor.set(env.ground); hemi.intensity = env.hemiI;
  sun.color.set(env.sun); sun.intensity = env.sunI;
  cats.forEach(c => resetCat(c, level.spawns[c.id]));
  roomYarn = 0;
  updateCamera(0, true);
}
function startRun(order) {
  run = { order: order || shuffle(Object.keys(ROOMS)).slice(0, 3), idx: 0, yarn: 0, blessings: [], photos: [] };
  mods.jump = mods.speed = mods.magnet = mods.yarnMul = 1;
  beginRoom();
}
function beginRoom() {
  loadLevel(run.order[run.idx]);
  roomLabel.textContent = 'Room ' + (run.idx + 1) + ' of ' + run.order.length + ' · ' + level.name;
  renderChips();
  state = 'play';
}
function restartRoom() { if (run) beginRoom(); }
function completeRoom() {
  run.yarn += roomYarn; save.bank += roomYarn; persist(); roomYarn = 0;
  blip([523, 659, 784], 0.5, 'triangle', 0.08);
  if (run.idx < run.order.length - 1) showBlessing(); else finishRun();
}
function renderChips() {
  chipsEl.innerHTML = '';
  (run ? run.blessings : []).forEach(id => { const b = BLESSINGS.find(x => x.id === id); const s = document.createElement('span'); s.className = 'chip'; s.textContent = b.name; chipsEl.appendChild(s); });
}
function showBlessing() {
  state = 'blessing';
  $('blessEyebrow').textContent = level.name + ' cleared · next is room ' + (run.idx + 2) + ' of ' + run.order.length;
  const grid = $('blessGrid'); grid.innerHTML = '';
  const offer = shuffle(BLESSINGS.filter(b => !run.blessings.includes(b.id))).slice(0, 3);
  offer.forEach(b => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn bless';
    btn.innerHTML = '<b>' + b.name + '</b><span>' + b.text + '</span>';
    btn.addEventListener('click', () => { b.apply(); run.blessings.push(b.id); closeMenu(); run.idx++; beginRoom(); blip([880, 1320], 0.3, 'sine', 0.07); });
    grid.appendChild(btn);
  });
  if (!offer.length) { run.idx++; beginRoom(); return; }
  openMenu(blessOverlay, 0);
}
function finishRun() {
  state = 'nap';
  save.dreams += 1; persist();
  $('napText').textContent = 'Both cats curled up in the sun. You brought home ' + run.yarn + ' yarn, and the jar at home now holds ' + save.bank + '.' + (run.photos.length ? ' Tonight\'s photos are going up on the wall at home.' : '');
  const strip = $('napStrip'); strip.innerHTML = '';
  run.photos.forEach((p, i) => {
    const f = document.createElement('figure'); f.className = 'polaroid'; f.style.setProperty('--tilt', [-4, 2, -1.5, 3][i % 4] + 'deg');
    f.innerHTML = '<img alt="Photo of both cats in ' + p.room + '" src="' + photoURL(p.src) + '"><figcaption>' + p.room + '</figcaption>';
    strip.appendChild(f);
  });
  strip.hidden = !run.photos.length;
  blip([523, 659, 784, 1046], 0.8, 'triangle', 0.08);
  openMenu(napOverlay, 0);
}


// ---------- Per-frame game logic ----------
const bubbles = [];
let time = 0;
function sayAt(at, text, color) {
  const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; el.style.color = color;
  document.body.appendChild(el); bubbles.push({ el, at, t: 0 });
}
const say = (c, text, color) => sayAt(() => c.pos, text, color);
function sayMeow(c) {
  c.meowT = 0.5; meowSound(c.id === 0 ? 560 : 430);
  say(c, c.id === 0 ? 'mrrp!' : 'mew?', c.id === 0 ? 'var(--p1)' : 'var(--p2)');
}
let cuddleT = 0;
function purr() {
  const a = audio(); if (!a) return;
  const t = a.currentTime, o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), f = a.createBiquadFilter(), g = a.createGain();
  o.type = 'sawtooth'; o.frequency.value = 46; f.type = 'lowpass'; f.frequency.value = 260;
  lfo.frequency.value = 24; lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g.gain);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.15); g.gain.linearRampToValueAtTime(0.0001, t + 0.9);
  o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); lfo.start(t); o.stop(t + 0.95); lfo.stop(t + 0.95);
}
function updateCuddle(dt) {
  const [a, b] = cats;
  const snug = (state === 'play' || state === 'home') && a.sitting && b.sitting && Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z) < 1.3 && Math.abs(a.pos.y - b.pos.y) < 0.2;
  if (!snug) { cuddleT = 0; return; }
  cuddleT += dt;
  if (cuddleT > 0.8) {
    cuddleT = 0; purr();
    const mid = { x: (a.pos.x + b.pos.x) / 2 + (Math.random() - 0.5) * 0.4, y: a.pos.y, z: (a.pos.z + b.pos.z) / 2 };
    sayAt(() => mid, '\u2665', 'var(--rose)');
  }
}
function updateCat(c, inp, dt) {
  const list = solidsFor(c);
  c.push = null;
  c.sitting = inp.sit && c.grounded;
  const accel = c.grounded ? 16 : 7, speed = SPEED * mods.speed;
  const tx = c.sitting ? 0 : inp.mx * speed, tz = c.sitting ? 0 : inp.mz * speed;
  c.vel.x += (tx - c.vel.x) * Math.min(1, accel * dt);
  c.vel.z += (tz - c.vel.z) * Math.min(1, accel * dt);
  if (Math.hypot(inp.mx, inp.mz) > 0.15 && !c.sitting) c.facing = Math.atan2(inp.mx, inp.mz);
  if (inp.jumpPressed) c.jumpBuf = 0.14;
  c.jumpBuf -= dt;
  c.coyote = c.grounded ? 0.1 : c.coyote - dt;
  if (c.jumpBuf > 0 && c.coyote > 0) {
    c.vel.y = JUMP_V * mods.jump; c.grounded = false; c.coyote = 0; c.jumpBuf = 0; c.squash = 1.22; c.sitting = false;
    blip([380 + c.id * 60, 620 + c.id * 60], 0.12, 'triangle', 0.05);
  }
  c.vel.y -= G * dt;
  if (!inp.jumpHeld && c.vel.y > 0) c.vel.y -= G * 1.4 * dt;
  if (c.groundRef && c.groundRef.cat) { const o = c.groundRef.cat; moveAxis(c, 'x', o.lastDelta.x, list); moveAxis(c, 'z', o.lastDelta.z, list); }
  moveAxis(c, 'x', c.vel.x * dt, list);
  moveAxis(c, 'z', c.vel.z * dt, list);
  c.wasGrounded = c.grounded;
  c.grounded = false; c.groundRef = null;
  moveAxis(c, 'y', c.vel.y * dt, list);
  if (c.pos.y <= 0) { c.pos.y = 0; c.vel.y = 0; c.grounded = true; c.groundRef = null; }
  if (c.grounded && !c.wasGrounded) c.squash = 0.78;
  const wet = level.water && c.pos.x > level.water.x0 && c.pos.x < level.water.x1 && c.pos.z > level.water.z0 && c.pos.z < level.water.z1 && c.pos.y < 0.05;
  if (wet && c.grounded) {
    Object.assign(c.pos, c.safe); c.vel.x = c.vel.y = c.vel.z = 0; c.squash = 0.6;
    blip([300, 120], 0.3, 'sawtooth', 0.05); say(c, 'splash!', '#9fc3ff');
  } else if (c.grounded && !c.groundRef?.cat) { c.safe = { x: c.pos.x, y: c.pos.y, z: c.pos.z }; }
  if (inp.paw) { c.pawT = 0.32; blip([700, 900], 0.08, 'square', 0.03); level.onPaw(c); }
  if (inp.meow) sayMeow(c);
}
function stepLevel(dt) {
  level.plates.forEach(p => {
    p.pressed = cats.some(c => c.pos.y < 0.12 && Math.hypot(c.pos.x - p.x, c.pos.z - p.z) < 0.85);
    p.mesh.material = p.pressed ? M.plateOn : M.plate; p.mesh.position.y = p.pressed ? 0.02 : 0.05;
  });
  level.update(dt);
  level.gates.forEach(g => {
    const inGate = cats.some(c => c.pos.x > g.x - 0.15 - R && c.pos.x < g.x + 0.15 + R && c.pos.z > g.z0 - R && c.pos.z < g.z1 + R && c.pos.y < g.h);
    const before = g.open;
    if (g.want || (inGate && g.open > 0.3)) g.open = Math.min(1, g.open + dt * 3.5); else g.open = Math.max(0, g.open - dt * 2.5);
    if (before < 0.05 && g.open >= 0.05) blip([520, 780], 0.18, 'sine', 0.06);
    g.solid.active = g.open < 0.6; g.group.position.y = -g.h * 0.97 * g.open;
  });
}
function inGoal(c) {
  const g = level.goal;
  return c.grounded && c.pos.y >= g.y - 0.05 && c.pos.x > g.x0 - R && c.pos.x < g.x1 + R && c.pos.z > g.z0 - R && c.pos.z < g.z1 + R;
}
function updateWorld(dt) {
  const reach = 0.55 * mods.magnet;
  level.yarns.forEach(y => {
    if (y.got) { y.fade = Math.min(1, y.fade + dt * 4); y.g.scale.setScalar(Math.max(0.001, 1 - y.fade)); y.g.position.y = y.base.y + y.fade * 0.8; if (y.fade >= 1) y.g.visible = false; return; }
    y.g.position.y = y.base.y + (reduceMotion ? 0 : Math.sin(time * 2.2 + y.phase) * 0.06);
    y.g.rotation.y += dt * 1.2;
    if (state !== 'play') return;
    for (const c of cats) {
      const dx = c.pos.x - y.base.x, dy = (c.pos.y + 0.35) - y.base.y, dz = c.pos.z - y.base.z;
      if (dx * dx + dy * dy + dz * dz < reach * reach) { y.got = true; roomYarn += mods.yarnMul; blip([660, 990, 1320], 0.22, 'sine', 0.08); break; }
    }
  });
  yarnEl.textContent = String(state === 'home' || (state === 'pause' && !run) ? save.bank : run ? run.yarn + roomYarn : 0);
  yarnLabel.textContent = run ? 'this dream' : 'in the jar';
  if (level.visual) level.visual();
  if (level.goal) level.goal.mesh.material.opacity = 0.22 + 0.13 * Math.sin(time * 2.5);
  if (state === 'home') { const o = level.objective(); if (objectiveEl.textContent !== o) objectiveEl.textContent = o; return; }
  if (state !== 'play') return;
  const both = cats.every(inGoal);
  let obj = level.objective();
  if (both) obj = level.photo ? 'Lovely!' : 'Say cheese!';
  if (objectiveEl.textContent !== obj) objectiveEl.textContent = obj;
  level.goalT = both ? level.goalT + dt : 0;
  // both cats made it: they sit, turn to the camera and get their photo taken
  posing = both;
  if (both) cats.forEach(c => { c.facing = Math.PI / 4 + (c.id ? -0.35 : 0.35); });
  if (both && level.goalT > 0.75 && !level.photo) snapPhoto();
  if (level.goalT > 1.6) { level.goalT = 0; posing = false; completeRoom(); }
}


// ---------- Dream photos ----------
let posing = false;
const flashEl = document.createElement('div'); flashEl.className = 'flash'; document.body.appendChild(flashEl);
const snapEl = document.createElement('figure'); snapEl.className = 'snap'; snapEl.setAttribute('aria-live', 'polite'); document.body.appendChild(snapEl);
let snapTimer = 0;
function snapPhoto() {
  let src = null;
  try { src = takePhoto(cats); } catch (e) { console.warn('Could not take the dream photo.', e); }
  level.photo = true;
  if (!src) return;
  const p = addPhoto(src, level.name, save.dreams + 1);
  if (run) run.photos.push(p);
  blip([1800, 1200], 0.06, 'square', 0.04); blip([900, 1400], 0.12, 'sine', 0.03);
  if (!reduceMotion) { flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on'); }
  snapEl.innerHTML = '<img alt="Photo of both cats in ' + level.name + '" src="' + photoURL(src) + '"><figcaption>' + level.name + '</figcaption>';
  snapEl.classList.add('on'); clearTimeout(snapTimer);
  snapTimer = setTimeout(() => snapEl.classList.remove('on'), 2600);
}


// ---------- Visuals ----------
let camSize = 7;
const tmpV = new THREE.Vector3();
function animateCat(c, dt) {
  const p = c.parts;
  p.root.position.set(c.pos.x, c.pos.y, c.pos.z);
  let dy = c.facing - p.root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  p.root.rotation.y += dy * Math.min(1, dt * 14);
  const speed = Math.hypot(c.vel.x, c.vel.z), sMax = SPEED * mods.speed;
  c.walk += speed * dt * 3.4;
  c.squash += (1 - c.squash) * Math.min(1, dt * 10);
  const forceSit = (state !== 'play' && state !== 'home') || posing || (level && level.curl && level.curl(c)) ? 1 : 0;
  c.sitT += ((c.sitting || forceSit ? 1 : 0) - c.sitT) * Math.min(1, dt * 12);
  const s = c.squash; p.body.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
  const air = !c.grounded;
  if (c.model) c.model.update({ speed, maxSpeed: sMax, air, vy: c.vel.y, sitT: c.sitT, squash: s, pawT: c.pawT, meowT: c.meowT, dt, time });
  const swing = air ? 0 : Math.sin(c.walk) * 0.7 * Math.min(1, speed / sMax);
  p.legs[0].rotation.x = air ? -0.7 : swing; p.legs[3].rotation.x = air ? 0.7 : swing;
  p.legs[1].rotation.x = air ? -0.7 : -swing; p.legs[2].rotation.x = air ? 0.7 : -swing;
  p.body.rotation.x = -0.5 * c.sitT;
  p.body.position.y = -0.04 * c.sitT + (air ? 0 : Math.abs(Math.sin(c.walk)) * 0.03 * Math.min(1, speed / sMax));
  p.body.position.z = -0.06 * c.sitT;
  p.legs[2].rotation.x += -1.1 * c.sitT; p.legs[3].rotation.x += -1.1 * c.sitT;
  p.legs[0].rotation.x += 0.5 * c.sitT; p.legs[1].rotation.x += 0.5 * c.sitT;
  if (c.pawT > 0) { c.pawT -= dt; p.legs[1].rotation.x = -1.6 * Math.sin(Math.max(0, c.pawT) / 0.32 * Math.PI); }
  if (c.meowT > 0) c.meowT -= dt;
  p.head.rotation.x = c.meowT > 0 ? -0.35 * Math.sin(c.meowT / 0.5 * Math.PI) : 0.1 * c.sitT;
  p.tail.rotation.x = -0.9 + 0.4 * c.sitT + (air ? 0.5 : 0);
  p.tailSegs.forEach((g, i) => { g.rotation.z = Math.sin(time * 2.4 + i * 0.7 + c.id) * (0.18 + speed * 0.02); g.rotation.x = 0.18 + 0.1 * i; });
  p.marker.position.set(c.pos.x, c.pos.y + 1.3 + (reduceMotion ? 0 : Math.sin(time * 3 + c.id) * 0.06), c.pos.z);
  p.marker.rotation.y += dt * 1.5;
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
}
window.addEventListener('resize', resize); resize();
function updateCamera(dt, snap) {
  const a = cats[0].pos, b = cats[1].pos;
  const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 4, (a.z + b.z) / 2);
  const spread = Math.hypot(a.x - b.x, a.z - b.z);
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  let want = Math.min(12, Math.max(5.2, spread * 0.5 + 3.4)) * Math.max(1, 1.25 / aspect);
  // a room can ask to keep more of itself in view (home shows its whole floor)
  const view = level && level.view;
  if (view) { mid.x += (view.x - mid.x) * view.pull; mid.z += (view.z - mid.z) * view.pull; want = Math.max(want, view.size * Math.max(1, 1.25 / aspect)); }
  const k = snap ? 1 : Math.min(1, dt * 3);
  camTarget.lerp(mid, k); camSize += (want - camSize) * k;
  camera.left = -camSize * aspect; camera.right = camSize * aspect; camera.top = camSize; camera.bottom = -camSize;
  camera.updateProjectionMatrix();
  camera.position.copy(camTarget).addScaledVector(CAM_DIR, 60);
  camera.lookAt(camTarget);
}
function updateBubbles(dt) {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const bb = bubbles[i]; bb.t += dt;
    const at = bb.at();
    tmpV.set(at.x, at.y + 1.0 + bb.t * 0.6, at.z).project(camera);
    const x = (tmpV.x * 0.5 + 0.5) * window.innerWidth, y = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
    bb.el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-100%)';
    bb.el.style.opacity = String(Math.max(0, 1 - bb.t / 1.1));
    if (bb.t > 1.1) { bb.el.remove(); bubbles.splice(i, 1); }
  }
}


// ---------- Keyboard ----------
window.addEventListener('keydown', e => {
  if (state === 'title') { e.preventDefault(); openHub(); return; }
  if (e.code === 'KeyM' && !e.repeat) { toggleMusic(); return; }
  if (e.code === 'Escape') { e.preventDefault(); if (state === 'play' || state === 'home') openPause(); else if (state === 'pause') resume(); return; }
  if (menu) {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') { menuFocus(); return; }
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (NAV_PREV.has(e.code)) menuNav(-1); else if (NAV_NEXT.has(e.code)) menuNav(1); else if (e.code === 'KeyE') menuActivate();
    return;
  }
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  if (!e.repeat) pressed.add(e.code);
  down.add(e.code);
});
window.addEventListener('keyup', e => down.delete(e.code));
window.addEventListener('blur', () => down.clear());
titleOverlay.addEventListener('click', () => openHub());

// ---------- Loop ----------
dressCats();
loadLevel('home');
if (!new URLSearchParams(location.search).has('placeholder')) {
  modelAvailable(MODEL.url).then(ok => ok && loadCatModel(MODEL.url)).then(gltf => {
    if (!gltf) return;
    const rig = attachModel(gltf);
    console.info('Cat model loaded. Clips:', rig.clipNames.join(', ') || 'none (procedural motion)');
  }).catch(err => console.warn('Cat model failed to load, keeping the placeholder cats.', err));
}
let last = performance.now();
const idle = { mx: 0, mz: 0, jumpHeld: false, jumpPressed: false, sit: false, paw: false, meow: false, restart: false };
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; advanceTime(dt);
  menuActed = false;
  const polled = pollPads();
  if (state === 'title') { if (polled.some(p => p.anyEdge)) openHub(); }
  else if (menu) {
    if (state === 'pause' && polled.some(p => p.edge[9] || p.edge[1])) resume();
    else for (const p of polled) { if (p.nav) menuNav(p.nav); if (p.accept) { menuActivate(); break; } }
  }
  const inputs = readInputs(polled);
  const playing = (state === 'play' || state === 'home') && !menuActed;
  if (playing && state === 'play' && inputs.some(i => i.restart)) restartRoom();
  if (playing && inputs.some(i => i.pause)) openPause();
  const steps = dt > 1 / 60 ? 2 : 1, h = dt / steps;
  for (let s = 0; s < steps; s++) {
    cats.forEach(c => { c.prev.x = c.pos.x; c.prev.z = c.pos.z; });
    stepLevel(h);
    cats.forEach((c, i) => {
      const inp = playing ? Object.assign({}, inputs[i]) : Object.assign({}, idle);
      if (s > 0) { inp.jumpPressed = false; inp.paw = false; inp.meow = false; }
      updateCat(c, inp, h);
      c.lastDelta.x = c.pos.x - c.prev.x; c.lastDelta.z = c.pos.z - c.prev.z;
    });
    updatePush(h);
  }
  updateWorld(dt);
  updateCuddle(dt);
  cats.forEach(c => animateCat(c, dt));
  updateCamera(dt, false);
  updateBubbles(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Hook for automated checks
window.__gato = {
  cats, mods, get level() { return level; }, get state() { return state; }, get run() { return run; }, get save() { return save; }, get roomYarn() { return roomYarn; },
  startRun: o => { closeMenu(); startRun(o); }, openHub, restartRoom,
  get music() { return music; }, openPause, resume,
  menuButtons: () => (menu ? menu.buttons.map(b => b.textContent) : []), menuActivate, menuNav
};
