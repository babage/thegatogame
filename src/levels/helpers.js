import * as THREE from 'three';
import { DEFAULT_ENV, M, mat, scene, sun, tileTex } from '../scene.js';
import { cats } from '../core.js';
// ---------- Level building helpers ----------
function newLevel(key, name, w, d) {
  const group = new THREE.Group(); scene.add(group);
  return { key, name, w, d, group, solids: [], plates: [], gates: [], yarns: [], spawns: [[2, 2], [3, 3]], goal: null, goalT: 0,
    env: DEFAULT_ENV, water: null, pushable: null, update: () => {}, onPaw: () => {}, objective: () => '' };
}
function disposeLevel(L) {
  scene.remove(L.group);
  L.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
}
function addBox(L, x0, y0, z0, x1, y1, z1, material, opts) {
  opts = opts || {};
  let mesh = null;
  if (material) {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), material);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = opts.cast !== false; mesh.receiveShadow = true;
    L.group.add(mesh);
  }
  let solid = null;
  if (opts.solid !== false) { solid = { min: [x0, y0, z0], max: [x1, y1, z1], active: true, name: opts.name || '' }; L.solids.push(solid); }
  return { mesh, solid };
}
function addMesh(L, geo, material, x, y, z, cast) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = cast !== false; m.receiveShadow = true; L.group.add(m); return m;
}
function shell(L, o) {
  const { w, d } = L;
  const floorMat = o.tiles ? new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.9 }) : mat(o.floor);
  if (o.tiles) { floorMat.map = tileTex.clone(); floorMat.map.needsUpdate = true; floorMat.map.repeat.set(w / 1.4, d / 1.4); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(w / 2, 0, d / 2); floor.receiveShadow = true; L.group.add(floor);
  if (o.planks) {
    const pm = mat(o.planks);
    for (let z = 1; z < d; z += 1) { const line = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.04), pm); line.rotation.x = -Math.PI / 2; line.position.set(w / 2, 0.003, z); line.receiveShadow = true; L.group.add(line); }
  }
  addBox(L, -0.4, 0, -0.4, w, 3.4, 0, mat(o.wallA), { name: 'wall' });
  addBox(L, -0.4, 0, 0, 0, 3.4, d, mat(o.wallB), { name: 'wall' });
  addBox(L, 0, 0, -0.02, w, 0.22, 0.06, M.trim, { solid: false, cast: false });
  addBox(L, -0.02, 0, 0, 0.06, 0.22, d, M.trim, { solid: false, cast: false });
  addBox(L, 0, 0, d, w + 0.4, 0.28, d + 0.4, M.trim, { solid: false });
  addBox(L, w, 0, 0, w + 0.4, 0.28, d + 0.4, M.trim, { solid: false });
  L.solids.push({ min: [0, 0, d], max: [w + 1, 9, d + 1], active: true, name: 'front' });
  L.solids.push({ min: [w, 0, -1], max: [w + 1, 9, d + 1], active: true, name: 'front' });
  L.solids.push({ min: [-1, 0, -1], max: [w + 1, 9, -0.4], active: true, name: 'cap' });
  L.solids.push({ min: [-1, 0, -1], max: [-0.4, 9, d + 1], active: true, name: 'cap' });
  sun.position.set(-6, 18, -4); sun.target.position.set(w / 2, 0, d / 2);
}
function rug(L, x, z, rx, rz, m, lift) {
  const r = new THREE.Mesh(new THREE.CircleGeometry(1, 40), m);
  r.rotation.x = -Math.PI / 2; r.scale.set(rx, rz, 1); r.position.set(x, 0.01 + (lift || 0), z); r.receiveShadow = true; L.group.add(r);
}
function plant(L, x, z, s) {
  addBox(L, x - 0.35 * s, 0, z - 0.35 * s, x + 0.35 * s, 0.7 * s, z + 0.35 * s, null, { name: 'plant' });
  addMesh(L, new THREE.CylinderGeometry(0.35 * s, 0.28 * s, 0.7 * s, 16), M.pot, x, 0.35 * s, z);
  [[0, 1.05, 0, 0.45], [0.22, 0.9, 0.1, 0.32], [-0.2, 0.95, -0.12, 0.34]].forEach(([dx, y, dz, r]) => addMesh(L, new THREE.IcosahedronGeometry(r * s, 0), M.leaf, x + dx * s, y * s, z + dz * s));
}
function makePlate(L, x, z) {
  const m = addMesh(L, new THREE.CylinderGeometry(0.78, 0.82, 0.1, 28), M.plate, x, 0.05, z, false);
  const ring = addMesh(L, new THREE.TorusGeometry(0.8, 0.05, 8, 32), M.trim, x, 0.1, z, false); ring.rotation.x = Math.PI / 2;
  const p = { x, z, mesh: m, pressed: false }; L.plates.push(p); return p;
}
function fenceWithGate(L, x, gz0, gz1, h) {
  const d = L.d;
  addBox(L, x - 0.15, 0, 0, x + 0.15, h, gz0, null, { name: 'fence' });
  addBox(L, x - 0.15, 0, gz1, x + 0.15, h, d, null, { name: 'fence' });
  const barGeo = new THREE.BoxGeometry(0.08, h, 0.08);
  for (let z = 0.25; z < d; z += 0.45) { if (z > gz0 && z < gz1) continue; addMesh(L, barGeo, M.fence, x, h / 2, z); }
  [[0, gz0], [gz1, d]].forEach(([z0, z1]) => { [h - 0.06, 0.3].forEach(y => addMesh(L, new THREE.BoxGeometry(0.16, 0.12, z1 - z0), M.fence, x, y, (z0 + z1) / 2)); });
  [gz0, gz1].forEach(z => addMesh(L, new THREE.BoxGeometry(0.22, h + 0.15, 0.22), M.wood, x, (h + 0.15) / 2, z));
  const solid = { min: [x - 0.15, 0, gz0], max: [x + 0.15, h, gz1], active: true, name: 'gate' };
  L.solids.push(solid);
  const group = new THREE.Group(); L.group.add(group);
  for (let z = gz0 + 0.25; z < gz1; z += 0.4) { const b = new THREE.Mesh(barGeo, M.gate); b.position.set(x, h / 2, z); b.castShadow = true; group.add(b); }
  [h - 0.06, 0.3, h / 2].forEach(y => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, gz1 - gz0), M.gate); r.position.set(x, y, (gz0 + gz1) / 2); group.add(r); });
  const gate = { x, z0: gz0, z1: gz1, h, solid, group, open: 0, want: false }; L.gates.push(gate); return gate;
}
const yarnGeo = new THREE.SphereGeometry(0.22, 16, 12), wrapGeo = new THREE.TorusGeometry(0.22, 0.025, 6, 24);
function addYarns(L, spots) {
  spots.forEach(([x, y, z], i) => {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const ball = new THREE.Mesh(yarnGeo, M.yarn); ball.castShadow = true; g.add(ball);
    const w1 = new THREE.Mesh(wrapGeo, M.trim); w1.rotation.x = 0.6; g.add(w1);
    const w2 = new THREE.Mesh(wrapGeo, M.trim); w2.rotation.y = 1.2; w2.rotation.x = -0.4; g.add(w2);
    L.group.add(g);
    L.yarns.push({ g, base: new THREE.Vector3(x, y, z), got: false, fade: 0, phase: i * 1.3 });
  });
}
function goalPad(L, x0, z0, x1, z1, y) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.goal);
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y + 0.015, (z0 + z1) / 2); L.group.add(m);
  L.goal = { x0, x1, z0, z1, y, mesh: m };
}
const anyCatOn = (y, test) => cats.some(c => c.grounded && c.pos.y >= y - 0.05 && test(c));

export { newLevel, disposeLevel, addBox, addMesh, shell, rug, plant, makePlate, fenceWithGate, yarnGeo, wrapGeo, addYarns, goalPad, anyCatOn };
