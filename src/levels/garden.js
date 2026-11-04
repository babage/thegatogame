import { addBox, addMesh, addYarns, goalPad, newLevel, shell } from './helpers.js';
import * as THREE from 'three';
import { M, mat } from '../scene.js';
import { cats, time } from '../core.js';
// ---------- Room 4: the moonlit garden ----------
function buildGarden() {
  const L = newLevel('garden', 'The moonlit garden', 22, 14);
  L.env = { bg: '#141a2e', hemi: '#9fb3ff', ground: '#24304a', hemiI: 0.55, sun: '#b9c8ff', sunI: 0.45 };
  shell(L, { floor: '#5e8a57', wallA: '#3f5a45', wallB: '#365140' });
  // pond across the middle
  const PX0 = 7, PX1 = 15;
  const water = addMesh(L, new THREE.PlaneGeometry(PX1 - PX0, L.d), M.water, (PX0 + PX1) / 2, 0.025, L.d / 2, false);
  water.rotation.x = -Math.PI / 2;
  [[PX0, 0], [PX1, 0]].forEach(([x]) => addBox(L, x - 0.12, 0, 0, x + 0.12, 0.08, L.d, mat('#8f8a7a'), { solid: false, cast: false }));
  L.water = { x0: PX0, x1: PX1, z0: 0, z1: L.d };
  for (let i = 0; i < 9; i++) { const x = PX0 + 0.3 + (i % 2) * (PX1 - PX0 - 0.6), z = 1 + i * 1.5; addMesh(L, new THREE.ConeGeometry(0.12, 0.9 + (i % 3) * 0.25, 5), M.reed, x, 0.45, z); }
  // hidden stepping stones
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#c9d4e8', emissive: '#7f9cff', emissiveIntensity: 0.25, roughness: 0.6, transparent: true, opacity: 0 });
  const stones = [[7.7, 2.4], [9.6, 3.3], [10.6, 5.2], [12.2, 6.2], [13.3, 7.9], [14.6, 9.2]].map(([x, z]) => {
    const m = addMesh(L, new THREE.CylinderGeometry(0.55, 0.6, 0.3, 18), stoneMat, x, 0.15, z);
    L.solids.push({ min: [x - 0.5, 0, z - 0.5], max: [x + 0.5, 0.3, z + 0.5], active: true, name: 'stone' });
    return m;
  });
  // moonbeams on both shores
  const moons = [[4.4, 3.0], [18.2, 10.6]].map(([x, z]) => {
    const disk = addMesh(L, new THREE.CircleGeometry(0.85, 32), M.moonGlow, x, 0.02, z, false); disk.rotation.x = -Math.PI / 2;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 5, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.position.set(x, 2.5, z); L.group.add(beam);
    return { x, z, disk };
  });
  // planter, bench, lanterns
  addBox(L, 0, 0, 0, 1.2, 1.0, 3, mat('#9a6b48'), { name: 'planter' });
  [[0.3, 0.6], [0.9, 1.5], [0.4, 2.4]].forEach(([x, z]) => addMesh(L, new THREE.IcosahedronGeometry(0.3, 0), mat('#d77fa1'), x, 1.15, z));
  addBox(L, 19, 0, 12.2, 21.6, 0.55, 13.2, M.wood, { name: 'bench' });
  [[2, 12.8], [16.2, 1.2], [20.8, 5.5]].forEach(([x, z]) => {
    addMesh(L, new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), M.dark, x, 0.55, z);
    addMesh(L, new THREE.SphereGeometry(0.16, 12, 10), M.lamp, x, 1.2, z, false);
    const pl = new THREE.PointLight('#ffc77a', 0.6, 5, 1.8); pl.position.set(x, 1.3, z); L.group.add(pl);
  });
  // fireflies
  const flyGeo = new THREE.BufferGeometry(), N = 36, flyPos = new Float32Array(N * 3), flySeed = [];
  for (let i = 0; i < N; i++) flySeed.push([Math.random() * L.w, 0.6 + Math.random() * 1.8, Math.random() * L.d, Math.random() * 6]);
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flies = new THREE.Points(flyGeo, new THREE.PointsMaterial({ color: '#fff3a0', size: 0.12, transparent: true, opacity: 0.9, depthWrite: false }));
  L.group.add(flies);
  // cat door goal
  addBox(L, 18.6, 0, -0.06, 20.6, 1.4, 0.04, M.wood, { solid: false, cast: false });
  addBox(L, 19.0, 0.1, -0.05, 20.2, 1.1, 0.06, M.dark, { solid: false, cast: false });
  goalPad(L, 17.6, 0.2, 21.4, 2.6, 0);
  addYarns(L, [[3, 0.3, 12], [9.6, 0.6, 3.3], [12.2, 0.6, 6.2], [16.5, 0.3, 12.5], [20, 0.3, 8], [0.6, 1.3, 1.5]]);
  L.spawns = [[2.6, 7.6], [4.6, 9.0]];
  let glow = 0;
  const onMoon = c => c.grounded && moons.some(m => Math.hypot(c.pos.x - m.x, c.pos.z - m.z) < 0.9);
  L.update = dt => {
    const lit = cats.some(onMoon);
    glow += ((lit ? 1 : 0) - glow) * Math.min(1, dt * 4);
    stoneMat.opacity = glow; stones.forEach(s => { s.visible = glow > 0.02; });
    moons.forEach(m => { m.disk.material.opacity = 0.3 + 0.3 * glow; });
  };
  L.visual = () => {
    for (let i = 0; i < N; i++) { const s = flySeed[i]; flyPos[i * 3] = s[0] + Math.sin(time * 0.4 + s[3]) * 0.8; flyPos[i * 3 + 1] = s[1] + Math.sin(time * 0.9 + s[3] * 2) * 0.25; flyPos[i * 3 + 2] = s[2] + Math.cos(time * 0.35 + s[3]) * 0.8; }
    flyGeo.attributes.position.needsUpdate = true;
  };
  L.objective = () => {
    const across = cats.filter(c => c.pos.x > PX1).length, lit = cats.some(onMoon);
    if (across === 2) return 'Both cats to the cat door in the hedge.';
    if (across === 1) return lit ? 'The stones are glowing. Hop across, quick!' : 'Stand in the moonbeam on this side so your partner can see the stones.';
    if (lit) return 'The moonlight shows the stepping stones. The other cat hops across!';
    return 'The pond hides stepping stones. One cat stands in the moonbeam so the other can see them.';
  };
  L.isSolved = () => cats.every(c => c.pos.x > PX1);
  return L;
}

export { buildGarden };
