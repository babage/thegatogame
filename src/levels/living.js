import { addBox, addMesh, addYarns, fenceWithGate, goalPad, makePlate, newLevel, plant, rug, shell } from './helpers.js';
import { M } from '../scene.js';
import * as THREE from 'three';
import { R, cats } from '../core.js';
import { blip } from '../audio.js';
import { catBox, overlap } from '../physics.js';
// ---------- Room 1: the living room ----------
function buildLiving() {
  const L = newLevel('living', 'The living room', 24, 14);
  const TREE = { x0: 20, x1: 23, z0: 1, z1: 4, h: 1.9 };
  shell(L, { floor: '#c8955f', planks: '#b8844f', wallA: '#d9b8a6', wallB: '#cfa996' });
  rug(L, 5.6, 8.6, 3.6, 2.6, M.rug); rug(L, 5.6, 8.6, 2.6, 1.7, M.rug2, 0.008); rug(L, 16.5, 8, 3, 2.4, M.rug);
  addBox(L, 0, 0, 3, 2.2, 0.8, 7, M.sofa, { name: 'sofa' });
  addBox(L, 0, 0.8, 3, 0.7, 1.6, 7, M.sofa2);
  addBox(L, 0, 0, 2.6, 2.2, 1.2, 3, M.sofa2);
  addBox(L, 0, 0, 7, 2.2, 1.2, 7.4, M.sofa2);
  addBox(L, 7, 0, 0, 9.6, 1.9, 0.9, M.wood, { name: 'shelf' });
  [[7.2, 0.25, M.book1], [7.6, 0.2, M.book2], [8.0, 0.28, M.book3], [8.4, 0.22, M.book1], [8.9, 0.3, M.book2]].forEach(([x, w, m], i) => {
    addBox(L, x, 1.0, 0.15, x + w, 1.45 + (i % 2) * 0.1, 0.8, m, { solid: false, cast: false });
    addBox(L, x + 0.1, 0.12, 0.15, x + 0.1 + w, 0.62 - (i % 2) * 0.1, 0.8, m, { solid: false, cast: false });
  });
  addBox(L, 3.0, 0, 0.6, 3.6, 0.1, 1.2, M.dark, { solid: false });
  addBox(L, 3.2, 0, 0.8, 3.4, 2.2, 1.0, M.dark, { name: 'lamp' });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.6, 20, 1, true), M.lamp); shade.position.set(3.3, 2.4, 0.9); L.group.add(shade);
  const lampLight = new THREE.PointLight('#ffc77a', 0.9, 14, 1.6); lampLight.position.set(3.3, 2.2, 1.4); L.group.add(lampLight);
  plant(L, 9.8, 12.6, 1); plant(L, 23.1, 12.8, 1.1); plant(L, 12.2, 0.8, 0.9);
  const gate = fenceWithGate(L, 11, 6, 8, 3.2);
  makePlate(L, 6, 11.2); makePlate(L, 14, 3);
  // cat tree
  addBox(L, TREE.x0, 0, TREE.z0, TREE.x1, 0.25, TREE.z1, M.carpet, { solid: false });
  addBox(L, TREE.x0, TREE.h - 0.3, TREE.z0, TREE.x1, TREE.h, TREE.z1, M.carpet, { solid: false });
  [[TREE.x0 + 0.35, TREE.z0 + 0.35], [TREE.x1 - 0.35, TREE.z0 + 0.35], [TREE.x0 + 0.35, TREE.z1 - 0.35], [TREE.x1 - 0.35, TREE.z1 - 0.35], [21.5, 2.5]].forEach(([x, z]) => addMesh(L, new THREE.CylinderGeometry(0.2, 0.2, TREE.h - 0.3, 12), M.post, x, (TREE.h - 0.3) / 2, z));
  L.solids.push({ min: [TREE.x0, 0, TREE.z0], max: [TREE.x1, TREE.h, TREE.z1], active: true, name: 'cat-tree' });
  addBox(L, 19.6, 1.7, -0.05, 23.6, 3.1, 0.02, M.window, { solid: false, cast: false });
  addBox(L, 19.5, 1.62, -0.02, 23.7, 1.72, 0.1, M.trim, { solid: false, cast: false });
  addBox(L, 21.55, 1.7, -0.02, 21.65, 3.1, 0.06, M.trim, { solid: false, cast: false });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 1.6), new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.set(21.5, TREE.h + 1.1, 1.9); beam.rotation.x = -0.55; L.group.add(beam);
  const spot = new THREE.SpotLight('#ffd79a', 1.2, 14, 0.5, 0.6, 1); spot.position.set(21.5, 6, -1); spot.target.position.set(21.5, TREE.h, 2.5); L.group.add(spot, spot.target);
  goalPad(L, TREE.x0, TREE.z0, TREE.x1, TREE.z1, TREE.h);
  // pouf
  const POUF = { w: 1.2, h: 0.9 };
  const top = new THREE.Vector3(22.2, TREE.h, 1.75), bottom = new THREE.Vector3(22.2, 0, 4.75);
  const poufMesh = addMesh(L, new THREE.CylinderGeometry(0.62, 0.62, POUF.h, 24), M.pouf, 0, 0, 0);
  const tuft = addMesh(L, new THREE.SphereGeometry(0.1, 10, 8), M.trim, 0, 0, 0);
  const pouf = { state: 'top', t: 0, pos: top.clone(), solid: { min: [0, 0, 0], max: [0, 0, 0], active: true, name: 'pouf' } };
  L.solids.push(pouf.solid);
  const sync = () => {
    const p = pouf.pos, hw = POUF.w / 2;
    pouf.solid.min = [p.x - hw, p.y, p.z - hw]; pouf.solid.max = [p.x + hw, p.y + POUF.h, p.z + hw];
    pouf.solid.active = pouf.state !== 'falling';
    poufMesh.position.set(p.x, p.y + POUF.h / 2, p.z); tuft.position.set(p.x, p.y + POUF.h + 0.02, p.z);
  };
  sync();
  addYarns(L, [[3.6, 0.3, 11.4], [1.2, 1.1, 5.0], [8.3, 2.2, 0.45], [16.2, 0.3, 8.2], [13.4, 0.3, 12.6], [22.4, 2.2, 3.4]]);
  L.spawns = [[4.2, 9.2], [6.8, 8.2]];
  L.pouf = pouf;
  const onTree = c => c.grounded && c.pos.y >= TREE.h - 0.05 && c.pos.x > TREE.x0 - R && c.pos.x < TREE.x1 + R && c.pos.z > TREE.z0 - R && c.pos.z < TREE.z1 + R;
  L.update = dt => {
    gate.want = L.plates.some(p => p.pressed);
    if (pouf.state !== 'falling') return;
    pouf.t += dt;
    const slide = 0.45, fall = 0.4, edge = TREE.z1 + 0.15;
    if (pouf.t < slide) { const k = pouf.t / slide; pouf.pos.set(top.x, top.y, top.z + (edge - top.z) * k * k); }
    else if (pouf.t < slide + fall) { const k = (pouf.t - slide) / fall; pouf.pos.set(top.x, TREE.h * (1 - k * k), edge + (bottom.z - edge) * k); }
    else {
      pouf.state = 'floor'; pouf.pos.copy(bottom); blip([160, 90], 0.25, 'sine', 0.16); sync();
      cats.forEach(c => { if (overlap(catBox(c), pouf.solid) && c.pos.y < POUF.h) { c.pos.y = POUF.h; c.vel.y = 0; } });
    }
    sync();
  };
  L.onPaw = c => {
    if (pouf.state === 'top' && onTree(c) && Math.hypot(c.pos.x - pouf.pos.x, c.pos.z - pouf.pos.z) < 1.7) { pouf.state = 'falling'; pouf.t = 0; blip([500, 300, 200], 0.5, 'sine', 0.1); }
  };
  L.objective = () => {
    const nB = cats.filter(c => c.pos.x > 11.2).length, nTree = cats.filter(onTree).length;
    if (pouf.state !== 'top') return nTree === 2 ? 'Stay in the sunbeam together...' : 'The pouf is a step now. Both cats into the sunbeam on the cat tree.';
    if (nTree > 0) return 'Paw the orange pouf off the cat tree (E, / or X) so your partner can climb up.';
    if (nB === 2) return 'The cat tree is too tall. One cat sits beside it (Shift or B), the other jumps on its back.';
    if (nB === 1) return 'Find the cushion plate on this side to hold the gate open for your partner.';
    return 'Sit on the pink cushion plate to open the pet gate.';
  };
  return L;
}

export { buildLiving };
