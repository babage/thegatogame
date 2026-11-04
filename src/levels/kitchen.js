import { addBox, addMesh, addYarns, fenceWithGate, goalPad, newLevel, plant, rug, shell } from './helpers.js';
import { M, mat } from '../scene.js';
import * as THREE from 'three';
import { time } from '../core.js';
import { blip } from '../audio.js';
// ---------- Room 2: the kitchen ----------
function buildKitchen() {
  const L = newLevel('kitchen', 'The kitchen', 20, 12);
  shell(L, { tiles: true, wallA: '#cfe0d0', wallB: '#bfd4c2' });
  // fridge and counter run
  addBox(L, 0, 0, 0, 1.8, 2.6, 1.8, M.fridge, { name: 'fridge' });
  addBox(L, 1.75, 1.0, 1.81, 1.8, 2.3, 1.85, M.dark, { solid: false, cast: false });
  addBox(L, 1.8, 0, 0, 12, 0.92, 1.6, M.counter, { name: 'counter' });
  addBox(L, 1.8, 0.92, 0, 12, 1.0, 1.7, M.counterTop, { name: 'counter-top' });
  for (let x = 2.4; x < 12; x += 1.6) addBox(L, x, 0.15, 1.6, x + 1.3, 0.8, 1.64, M.trim, { solid: false, cast: false });
  addBox(L, 5, 1.0, 0.2, 6.4, 1.25, 1.2, M.dark, { solid: false });
  // table with walk-under legs
  addBox(L, 5, 0.95, 6, 8, 1.15, 8, M.wood, { name: 'table' });
  [[5.15, 6.15], [7.85, 6.15], [5.15, 7.85], [7.85, 7.85]].forEach(([x, z]) => addBox(L, x - 0.08, 0, z - 0.08, x + 0.08, 0.95, z + 0.08, M.wood, { name: 'leg' }));
  rug(L, 6.5, 7, 2.6, 1.8, M.rug2);
  // cat bowls
  [[3.0, 3.0, '#7fc8f8'], [3.7, 3.0, '#e2647c']].forEach(([x, z, c]) => addMesh(L, new THREE.CylinderGeometry(0.22, 0.17, 0.12, 16), mat(c), x, 0.06, z));
  plant(L, 12.4, 11.2, 0.9);
  const gate = fenceWithGate(L, 13, 5, 7, 3.2);
  // bells
  const bells = [[2.5, 0, 10.2], [11, 1.0, 0.8]].map(([x, y, z], i) => {
    const base = addMesh(L, new THREE.CylinderGeometry(0.3, 0.34, 0.12, 20), M.dark, x, y + 0.06, z);
    const dome = addMesh(L, new THREE.SphereGeometry(0.26, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.bell, x, y + 0.12, z);
    const nub = addMesh(L, new THREE.SphereGeometry(0.06, 8, 6), M.bell, x, y + 0.4, z);
    if (i === 0) L.solids.push({ min: [x - 0.3, y, z - 0.3], max: [x + 0.3, y + 0.2, z + 0.3], active: true, name: 'bell' });
    return { x, y, z, dome, nub, t: -99, base };
  });
  // cat flap + doormat goal
  addBox(L, 16.2, 0, -0.06, 18.4, 1.4, 0.04, M.wood, { solid: false, cast: false });
  addBox(L, 16.6, 0.1, -0.05, 18.0, 1.1, 0.06, M.dark, { solid: false, cast: false });
  goalPad(L, 15.3, 0.2, 19.3, 2.6, 0);
  addYarns(L, [[6.5, 0.3, 7], [4, 1.3, 0.8], [0.9, 2.9, 0.9], [9, 0.3, 10.5], [16, 0.3, 9], [17.3, 0.3, 4.6]]);
  L.spawns = [[3.5, 7.2], [9.6, 9.4]];
  let solved = false;
  L.update = () => { gate.want = solved; };
  L.onPaw = c => {
    bells.forEach((b, i) => {
      if (Math.hypot(c.pos.x - b.x, c.pos.z - b.z) < 1.0 && Math.abs(c.pos.y - b.y) < 0.45) {
        b.t = time; blip([i ? 1175 : 880, i ? 1175 : 880], 0.5, 'triangle', 0.09);
        if (!solved && Math.abs(bells[0].t - bells[1].t) < 0.9) { solved = true; blip([523, 784, 1046], 0.6, 'sine', 0.08); }
      }
    });
  };
  L.visual = () => bells.forEach(b => {
    const lit = solved || time - b.t < 0.9;
    b.dome.material = lit ? M.bellOn : M.bell;
    const k = Math.max(0, 1 - (time - b.t) / 0.4);
    b.dome.scale.set(1 + 0.12 * k, 1 - 0.1 * k, 1 + 0.12 * k);
  });
  L.objective = () => {
    if (solved) return 'Ding ding! The pet gate is open. Both cats to the cat flap.';
    const recent = bells.filter(b => time - b.t < 0.9).length;
    if (recent === 1) return 'One bell rang. The other one has to ring within a second!';
    return 'Paw both bells within a second of each other (E, / or X). One is up on the counter. Count down together!';
  };
  L.isSolved = () => solved;
  return L;
}

export { buildKitchen };
