import { addBox, addMesh, newLevel, plant, rug, shell } from './helpers.js';
import { M, camera, mat } from '../scene.js';
import * as THREE from 'three';
import { R, cats, time } from '../core.js';
import { COATS, HATS, persist, save } from '../save.js';
import { dressCats, makeHat } from '../cats.js';
import { blip } from '../audio.js';
import { allPhotos, photoURL } from '../photos.js';
// ---------- Home: the cat flat ----------
// A room you walk around instead of a menu. Step on a coat cushion or a hat mat to try it on,
// paw to buy it with yarn, and curl up in the big basket together to start a dream.

const CAT_NAMES = ['Marmalade', 'Smoke'];
const BASKET = { x: 12.6, z: 7.6, r: 1.45 };

function buildHome() {
  const L = newLevel('home', 'Home', 16, 11);
  L.env = { bg: '#2b2233', hemi: '#fff1dc', ground: '#6a4d52', hemiI: 0.68, sun: '#ffd9a8', sunI: 1.0 };
  shell(L, { floor: '#c89a6e', planks: '#b98a60', wallA: '#efd9c4', wallB: '#e6ccb6' });
  L.spawns = [[6.6, 6.4], [8.0, 6.8]];
  L.view = { x: 8, z: 5.5, pull: 0.6, size: 7.2 };

  // window and sunbeam on the back wall
  addBox(L, 9.4, 1.0, -0.06, 11.6, 2.6, 0.04, M.window, { solid: false, cast: false });
  addBox(L, 10.45, 1.0, -0.04, 10.55, 2.6, 0.06, M.trim, { solid: false, cast: false });
  addBox(L, 9.4, 1.75, -0.04, 11.6, 1.85, 0.06, M.trim, { solid: false, cast: false });
  const beam = addMesh(L, new THREE.PlaneGeometry(2.4, 4.2), new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.16, depthWrite: false }), 10.8, 0.02, 2.6, false);
  beam.rotation.x = -Math.PI / 2; beam.rotation.z = 0.35;
  rug(L, 4.2, 7.5, 3.4, 2.4, M.rug);
  rug(L, 10.2, 3.2, 3.2, 1.3, M.rug2);
  plant(L, 0.8, 0.8, 1.0);
  plant(L, 15.2, 10.2, 0.8);
  // bookshelf and armchair for a lived-in look
  addBox(L, 0, 0, 1.8, 0.7, 2.4, 4.4, M.wood, { name: 'shelf' });
  [[2.0, M.book1], [2.5, M.book2], [3.0, M.book3], [3.6, M.book1]].forEach(([z, m], i) => addBox(L, 0.7, 1.25 + (i % 2) * 0.02, z, 0.95, 1.75 - (i % 3) * 0.08, z + 0.4, m, { solid: false }));
  addBox(L, 14.4, 0, 0.4, 16, 0.9, 2.6, M.sofa, { name: 'armchair' });
  addBox(L, 15.4, 0.9, 0.4, 16, 1.7, 2.6, M.sofa2);

  // ---- labels floating over the stations ----
  const tags = [];
  const tagLayer = document.createElement('div'); tagLayer.className = 'tags'; document.body.appendChild(tagLayer);
  function addTag(x, y, z) {
    const el = document.createElement('div'); el.className = 'tag'; tagLayer.appendChild(el);
    const t = { el, pos: new THREE.Vector3(x, y, z), html: '' };
    tags.push(t); return t;
  }
  const setTag = (t, html, cls) => { if (t.html !== html) { t.el.innerHTML = html; t.html = html; } t.el.className = 'tag' + (cls ? ' ' + cls : ''); };
  const ball = n => '<span class="tball"></span>' + n;

  // ---- stations: coats on cushions, hats on mats in front of little pedestals ----
  const stations = [];
  COATS.forEach((c, i) => {
    const x = 2.2 + (i % 3) * 1.55, z = 6.6 + Math.floor(i / 3) * 1.7;
    const cushion = addMesh(L, new THREE.CylinderGeometry(0.58, 0.62, 0.12, 28), mat(c.coat), x, 0.06, z, false);
    const piping = addMesh(L, new THREE.TorusGeometry(0.6, 0.035, 8, 32), mat(c.belly), x, 0.12, z, false); piping.rotation.x = Math.PI / 2;
    stations.push({ kind: 'coat', item: c, x, z, r: 0.62, mesh: cushion, tag: addTag(x, 0.5, z) });
  });
  HATS.forEach((h, i) => {
    const x = 2.6 + i * 1.6, z = 2.2;
    const matMesh = addMesh(L, new THREE.CylinderGeometry(0.5, 0.52, 0.06, 24), mat('#f3d6de'), x, 0.03, z, false);
    addBox(L, x - 0.22, 0, 0.3, x + 0.22, 0.9, 0.74, M.wood, { name: 'pedestal' });
    const show = makeHat(h.id); show.scale.setScalar(1.7); show.position.set(x, 0.75, 0.52); L.group.add(show);
    stations.push({ kind: 'hat', item: h, x, z, r: 0.52, mesh: matMesh, show, tag: addTag(x, 1.7, 0.52) });
  });

  // ---- the dream basket ----
  const wick = addMesh(L, new THREE.TorusGeometry(BASKET.r, 0.22, 10, 40), M.wicker, BASKET.x, 0.2, BASKET.z);
  wick.rotation.x = Math.PI / 2;
  addMesh(L, new THREE.CylinderGeometry(BASKET.r - 0.05, BASKET.r - 0.05, 0.1, 40), M.pillow, BASKET.x, 0.05, BASKET.z, false);
  const glow = addMesh(L, new THREE.RingGeometry(BASKET.r - 0.1, BASKET.r + 0.35, 48), new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0, depthWrite: false }), BASKET.x, 0.03, BASKET.z, false);
  glow.rotation.x = -Math.PI / 2;
  const basketTag = addTag(BASKET.x, 1.0, BASKET.z);

  // ---- yarn jar: holds the yarn you've banked, one ball per yarn up to 24 ----
  addBox(L, 7.9, 0, 9.4, 9.1, 0.7, 10.6, M.wood, { name: 'jar-table' });
  addMesh(L, new THREE.CylinderGeometry(0.42, 0.42, 1.0, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.25, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 8.5, 1.2, 10.0, false);
  addMesh(L, new THREE.CylinderGeometry(0.46, 0.46, 0.08, 24), M.band, 8.5, 1.72, 10.0);
  const jarBalls = [];
  for (let i = 0; i < 24; i++) {
    const b = addMesh(L, new THREE.SphereGeometry(0.11, 10, 8), M.yarn, 8.5 + Math.cos(i * 2.4) * 0.22 * ((i % 3) / 2 + 0.3), 0.82 + Math.floor(i / 4) * 0.15, 10.0 + Math.sin(i * 2.4) * 0.22 * ((i % 3) / 2 + 0.3), false);
    b.visible = false; jarBalls.push(b);
  }
  const jarTag = addTag(8.5, 2.1, 10.0);

  // ---- memory wall: your newest dream photos, a little gallery between the window and the armchair ----
  const wallPhotos = allPhotos().slice(-6);
  const loader = new THREE.TextureLoader();
  wallPhotos.forEach((p, i) => {
    const x = 12.25 + (i % 3) * 0.98, y = 2.4 - Math.floor(i / 3) * 0.86 + (i % 2) * 0.05, tilt = [0.04, -0.03, 0.02, -0.05][i % 4];
    const frame = addBox(L, x - 0.45, y - 0.36, -0.06, x + 0.45, y + 0.36, 0.05, M.wood, { solid: false, cast: false }).mesh;
    frame.rotation.z = tilt;
    const tex = loader.load(photoURL(p.src)); tex.encoding = THREE.sRGBEncoding;
    const pic = addMesh(L, new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshBasicMaterial({ map: tex }), x, y, 0.065, false);
    pic.rotation.z = tilt;
  });
  if (save.dreams > 0) addTag(wallPhotos.length ? 13.2 : 10.5, 3.05, 0.1).el.innerHTML = save.dreams === 1 ? '1 dream together' : save.dreams + ' dreams together';

  // ---- behaviour ----
  const standing = c => c.grounded && c.pos.y < 0.2;
  const on = (c, s) => standing(c) && Math.hypot(c.pos.x - s.x, c.pos.z - s.z) < s.r + R * 0.3;
  const wearing = (i, s) => save.wear[i][s.kind] === s.item.id;
  const owned = s => save.owned.includes(s.item.id);
  const lastOn = [null, null];
  let dreamT = 0;
  L.onDream = () => {};
  L.say = () => {};

  function wear(i, s) {
    save.wear[i][s.kind] = s.item.id; persist(); dressCats();
    blip([700, 880], 0.12, 'sine', 0.05);
  }
  L.update = dt => {
    cats.forEach((c, i) => {
      const s = stations.find(st => on(c, st)) || null;
      if (s !== lastOn[i] && s && owned(s) && !wearing(i, s)) wear(i, s);
      lastOn[i] = s;
    });
    const inBasket = cats.filter(c => standing(c) && Math.hypot(c.pos.x - BASKET.x, c.pos.z - BASKET.z) < BASKET.r - 0.2);
    dreamT = inBasket.length === 2 ? dreamT + dt : 0;
    if (dreamT > 1.4) { dreamT = 0; L.onDream(); }
  };
  L.onPaw = c => {
    const i = c.id, s = stations.find(st => on(c, st));
    if (!s) return;
    if (owned(s)) { if (!wearing(i, s)) wear(i, s); return; }
    if (save.bank >= s.item.cost) {
      save.bank -= s.item.cost; save.owned.push(s.item.id); persist();
      wear(i, s);
      blip([660, 990, 1320], 0.4, 'sine', 0.08);
      L.say(c, 'new ' + s.kind + '!', 'var(--sun)');
    } else {
      blip([220, 180], 0.15, 'square', 0.04);
      L.say(c, (s.item.cost - save.bank) + ' more yarn', 'var(--cream)');
    }
  };
  L.objective = () => {
    const inB = cats.filter(c => standing(c) && Math.hypot(c.pos.x - BASKET.x, c.pos.z - BASKET.z) < BASKET.r - 0.2);
    if (inB.length === 2) return 'Sweet dreams...';
    if (inB.length === 1) return CAT_NAMES[inB[0].id] + ' is curled up in the basket. ' + CAT_NAMES[1 - inB[0].id] + ', hop in too!';
    const shop = cats.map(c => stations.find(st => on(c, st))).find(s => s && !owned(s));
    if (shop) return save.bank >= shop.item.cost ? 'Paw (E, / or X) to buy the ' + shop.item.name.toLowerCase() + ' for ' + shop.item.cost + ' yarn.' : 'The ' + shop.item.name.toLowerCase() + ' costs ' + shop.item.cost + ' yarn. Dream some more to fill the jar!';
    return 'Step on a cushion to try a coat, or a mat to try a hat. Curl up in the big basket together to start a dream.';
  };

  const v = new THREE.Vector3();
  L.visual = () => {
    // station looks and labels
    stations.forEach(s => {
      const who = cats.filter(c => on(c, s)).map(c => c.id);
      const own = owned(s), worn = [0, 1].filter(i => wearing(i, s));
      s.mesh.scale.y = who.length ? 0.6 : 1;
      if (s.show) s.show.rotation.y = time * 0.8 + s.x;
      const name = s.item.name;
      if (who.length && !own) setTag(s.tag, name + ' · ' + ball(s.item.cost) + (save.bank >= s.item.cost ? '<small>paw to buy</small>' : '<small>need ' + (s.item.cost - save.bank) + ' more</small>'), 'big' + (save.bank >= s.item.cost ? ' can' : ''));
      else if (who.length) setTag(s.tag, name, 'big');
      else if (!own) setTag(s.tag, ball(s.item.cost), 'price');
      else setTag(s.tag, worn.map(i => '<span class="tdot p' + (i + 1) + '"></span>').join(''), worn.length ? 'worn' : 'hide');
    });
    // basket glow fills while both cats are in it
    glow.material.opacity = 0.2 + 0.5 * Math.min(1, dreamT / 1.4) + 0.08 * Math.sin(time * 3);
    setTag(basketTag, dreamT > 0 ? 'Drifting off' + '.'.repeat(1 + Math.floor(time * 3) % 3) : 'Dream basket', dreamT > 0 ? 'big can' : 'big');
    jarBalls.forEach((b, i) => { b.visible = i < save.bank; });
    setTag(jarTag, ball(save.bank) + ' in the jar', 'big');
    // project labels to the screen
    tags.forEach(t => {
      v.copy(t.pos).project(camera);
      t.el.style.transform = 'translate(' + ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px,' + ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px) translate(-50%,-100%)';
    });
  };
  // cats settle into a curl as soon as they step into the basket
  L.curl = c => standing(c) && Math.hypot(c.pos.x - BASKET.x, c.pos.z - BASKET.z) < BASKET.r - 0.2;
  L.cleanup = () => tagLayer.remove();
  L.stations = stations;
  L.basket = BASKET;
  return L;
}

export { buildHome };
