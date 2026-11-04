import { addBox, addMesh, addYarns, goalPad, newLevel, shell } from './helpers.js';
import { M, mat } from '../scene.js';
import * as THREE from 'three';
import { catBox, overlap } from '../physics.js';
import { R, cats, time } from '../core.js';
// ---------- Room 5: the attic ----------
function buildAttic() {
  const L = newLevel('attic', 'The attic', 18, 12);
  L.env = { bg: '#231b26', hemi: '#ffe3c4', ground: '#4a3442', hemiI: 0.6, sun: '#ffd9a8', sunI: 0.7 };
  shell(L, { floor: '#a77d5a', planks: '#94694a', wallA: '#b9a28a', wallB: '#ad957d' });
  // loft along the back
  addBox(L, 10, 0, 0, 18, 1.9, 3, M.loft, { name: 'loft' });
  addBox(L, 10, 1.9, 0, 18, 1.93, 3, M.rug, { solid: false, cast: false });
  for (let x = 10.6; x < 18; x += 1.6) addBox(L, x, 0, 3, x + 0.12, 1.9, 3.06, M.wood, { solid: false, cast: false });
  // round window + goal cushion
  addMesh(L, new THREE.CircleGeometry(0.75, 32), M.window, 15.6, 2.7, 0.02, false);
  addMesh(L, new THREE.TorusGeometry(0.78, 0.07, 8, 32), M.trim, 15.6, 2.7, 0.04, false);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.1, 2.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  shaft.position.set(15.6, 2.4, 1.2); shaft.rotation.x = 1.0; L.group.add(shaft);
  addBox(L, 13.8, 1.9, 0.3, 17.4, 2.0, 2.6, M.pillow, { solid: false });
  goalPad(L, 13.6, 0.2, 17.6, 2.8, 1.9);
  // clutter
  addBox(L, 6.8, 0, 3.6, 8.6, 1.2, 5.2, M.crate, { name: 'crates' });
  addBox(L, 7.0, 1.2, 3.8, 8.0, 1.7, 4.8, M.crate, { solid: false });
  addBox(L, 0, 0, 0, 1.6, 0.8, 2, M.crate, { name: 'crate' });
  addBox(L, 0, 0, 7, 1.8, 0.8, 9.5, M.sofa, { name: 'armchair' });
  addBox(L, 0, 0.8, 7, 0.5, 1.6, 9.5, M.sofa2);
  addBox(L, 13.5, 0, 8.6, 14.5, 0.9, 9.4, mat('#d9506d'), { name: 'rocking-horse' });
  addMesh(L, new THREE.SphereGeometry(0.28, 12, 10), mat('#d9506d'), 14.5, 1.1, 9.0);
  addMesh(L, new THREE.TorusGeometry(0.9, 0.05, 6, 24, Math.PI), M.wood, 14, 0.0, 9.0).rotation.y = Math.PI / 2;
  const hangLight = new THREE.PointLight('#ffc77a', 0.9, 12, 1.6); hangLight.position.set(6, 3.0, 7); L.group.add(hangLight);
  addMesh(L, new THREE.SphereGeometry(0.18, 12, 10), M.lamp, 6, 3.0, 7, false);
  // the heavy trunk
  const T = { w: 1.4, h: 0.95 };
  const trunkGroup = new THREE.Group(); L.group.add(trunkGroup);
  const body = new THREE.Mesh(new THREE.BoxGeometry(T.w, T.h, T.w), M.trunk); body.position.y = T.h / 2; body.castShadow = body.receiveShadow = true; trunkGroup.add(body);
  [-0.4, 0.4].forEach(x => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, T.h + 0.02, T.w + 0.02), M.band); b.position.set(x, T.h / 2, 0); trunkGroup.add(b); });
  const lid = new THREE.Mesh(new THREE.BoxGeometry(T.w + 0.04, 0.08, T.w + 0.04), M.band); lid.position.y = T.h - 0.03; trunkGroup.add(lid);
  const trunk = { x: 4.5, z: 8.5, strain: 0, solid: { min: [0, 0, 0], max: [0, T.h, 0], active: true, name: 'trunk', pushable: true } };
  const syncTrunk = () => { const hw = T.w / 2; trunk.solid.min = [trunk.x - hw, 0, trunk.z - hw]; trunk.solid.max = [trunk.x + hw, T.h, trunk.z + hw]; trunkGroup.position.set(trunk.x, 0, trunk.z); };
  syncTrunk();
  L.solids.push(trunk.solid);
  L.pushable = trunk;
  trunk.move = (axis, delta) => {
    const i = axis === 'x' ? 0 : 2, trial = { min: trunk.solid.min.slice(), max: trunk.solid.max.slice() };
    trial.min[i] += delta; trial.max[i] += delta;
    const blocked = L.solids.some(s => s !== trunk.solid && s.active && overlap(trial, s)) || cats.some(c => overlap(catBox(c), trial) && !(c.groundRef === trunk.solid));
    if (blocked) return false;
    const riders = cats.filter(c => c.groundRef === trunk.solid);
    if (axis === 'x') trunk.x += delta; else trunk.z += delta;
    riders.forEach(c => { c.pos[axis] += delta; });
    syncTrunk();
    return true;
  };
  L.visual = () => { trunk.strain = Math.max(0, trunk.strain - 0.05); trunkGroup.rotation.z = Math.sin(time * 40) * 0.03 * trunk.strain; };
  addYarns(L, [[8.4, 1.5, 4.9], [0.8, 1.1, 1.0], [11, 2.2, 1.4], [3, 0.3, 11], [16.5, 0.3, 6], [12.2, 0.3, 10.8]]);
  L.spawns = [[3.2, 6.4], [5.6, 6.6]];
  let hinted = 0;
  L.update = () => { if (hinted > 0) hinted--; };
  L.onStrain = () => { trunk.strain = 1; hinted = 90; };
  L.objective = () => {
    const up = cats.filter(c => c.grounded && c.pos.y >= 1.85 && c.pos.x > 10 - R && c.pos.z < 3 + R).length;
    const nearLoft = trunk.x > 10.5 && trunk.z < 4.2;
    if (up === 2) return 'Curl up on the window cushion together.';
    if (nearLoft) return 'The trunk is a step now. Climb onto it, then up to the loft.';
    if (hinted > 0) return 'Too heavy for one cat! Both cats push the trunk from the same side.';
    return 'The loft is too high. Push the old trunk over to it, both cats together from the same side.';
  };
  L.trunk = trunk;
  return L;
}

export { buildAttic };
