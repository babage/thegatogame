import { addBox, addMesh, addYarns, anyCatOn, goalPad, makePlate, newLevel, plant, rug, shell } from './helpers.js';
import { M, mat } from '../scene.js';
import * as THREE from 'three';
import { H, R, cats } from '../core.js';
import { catBox, overlap } from '../physics.js';
import { blip } from '../audio.js';
// ---------- Room 3: the bedroom ----------
function buildBedroom() {
  const L = newLevel('bedroom', 'The bedroom', 18, 12);
  shell(L, { floor: '#b99a7a', planks: '#a98a6b', wallA: '#c9c3e0', wallB: '#bdb6d6' });
  rug(L, 9, 7.5, 3.4, 2.4, M.rug); rug(L, 9, 7.5, 2.2, 1.5, M.rug2, 0.008);
  // bed
  addBox(L, 0, 0, 4, 3.6, 0.9, 9, M.bed, { name: 'bed' });
  addBox(L, 0, 0.9, 4, 0.3, 1.7, 9, M.wood, { name: 'headboard' });
  addBox(L, 1.6, 0.9, 4.05, 3.6, 0.95, 8.95, M.blanket, { solid: false });
  addBox(L, 0.35, 0.9, 4.5, 1.2, 1.15, 6.2, M.pillow, { solid: false });
  addBox(L, 0.35, 0.9, 6.8, 1.2, 1.15, 8.5, M.pillow, { solid: false });
  // laundry lift
  const LX0 = 6.4, LX1 = 8.2, LZ0 = 0.2, LZ1 = 2.0, LOW = 0.15, HIGH = 2.6;
  const plate = makePlate(L, 5.2, 9.6);
  const liftGroup = new THREE.Group(); L.group.add(liftGroup);
  const plat = new THREE.Mesh(new THREE.BoxGeometry(LX1 - LX0, 0.15, LZ1 - LZ0), M.wicker); plat.position.set(0, -0.075, 0); plat.castShadow = true; plat.receiveShadow = true; liftGroup.add(plat);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(sx * sz > 0 ? 0.08 : LX1 - LX0, 0.18, sx * sz > 0 ? LZ1 - LZ0 : 0.08), M.wicker);
    rim.position.set(sx * sz > 0 ? sx * (LX1 - LX0) / 2 : 0, 0.09, sx * sz > 0 ? 0 : sz * (LZ1 - LZ0) / 2); liftGroup.add(rim);
    addMesh(L, new THREE.CylinderGeometry(0.025, 0.025, 4.2, 6), M.rope, (LX0 + LX1) / 2 + sx * 0.8, 2.1, (LZ0 + LZ1) / 2 + sz * 0.8, false);
  });
  const lift = { y: LOW, solid: { min: [LX0, 0, LZ0], max: [LX1, LOW, LZ1], active: true, name: 'lift' } };
  L.solids.push(lift.solid);
  // wardrobe, dresser, drawers, switch
  addBox(L, 8.2, 0, 0, 12, 2.6, 2, M.wood, { name: 'wardrobe' });
  addBox(L, 10.08, 0.2, 2.0, 10.12, 2.4, 2.04, M.dark, { solid: false, cast: false });
  addBox(L, 12, 0, 0, 14.4, 1.9, 1.2, mat('#a3765a'), { name: 'dresser' });
  const drawers = [{ h: 1.3, z0: 1.2, z1: 2.0 }, { h: 0.65, z0: 2.0, z1: 2.8 }].map(d => {
    const m = addMesh(L, new THREE.BoxGeometry(2.3, d.h, d.z1 - d.z0), mat('#c08a63'), 13.2, d.h / 2, 0.6);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M.dark); knob.position.set(0, d.h / 2 - 0.2, (d.z1 - d.z0) / 2 + 0.03); m.add(knob);
    const solid = { min: [12.05, 0, d.z0], max: [14.35, d.h, d.z1], active: false, name: 'drawer' };
    L.solids.push(solid);
    return Object.assign(d, { mesh: m, solid });
  });
  addMesh(L, new THREE.BoxGeometry(0.4, 0.55, 0.06), M.trim, 11.3, 3.0, 0.03, false);
  const toggle = addMesh(L, new THREE.BoxGeometry(0.1, 0.2, 0.08), M.dark, 11.3, 3.05, 0.09, false);
  const lampLight = new THREE.PointLight('#ffc77a', 0, 9, 1.6); lampLight.position.set(13.2, 2.6, 1.0); L.group.add(lampLight);
  const lampShade = addMesh(L, new THREE.CylinderGeometry(0.2, 0.32, 0.35, 16, 1, true), M.dark, 13.8, 2.2, 0.5);
  addMesh(L, new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), M.dark, 13.8, 2.0, 0.5);
  // basket on wardrobe = goal
  const basket = addMesh(L, new THREE.TorusGeometry(0.75, 0.12, 8, 24), M.wicker, 9.9, 2.72, 1.0); basket.rotation.x = Math.PI / 2;
  addMesh(L, new THREE.CylinderGeometry(0.7, 0.7, 0.08, 24), M.pillow, 9.9, 2.64, 1.0, false);
  goalPad(L, 8.2, 0, 12, 2, 2.6);
  plant(L, 17, 11, 1);
  addYarns(L, [[2.2, 1.25, 6.5], [13.2, 2.2, 0.6], [11.5, 2.9, 1.6], [10, 0.3, 6], [15.5, 0.3, 9], [4, 0.3, 11.2]]);
  L.spawns = [[4.6, 6.6], [6.8, 8.0]];
  let switched = false, drawerT = 0;
  const xzOver = (c, s) => c.pos.x + R > s.min[0] && c.pos.x - R < s.max[0] && c.pos.z + R > s.min[2] && c.pos.z - R < s.max[2];
  L.update = dt => {
    const target = plate.pressed ? HIGH : LOW;
    let dy = Math.max(-1.6 * dt, Math.min(1.6 * dt, target - lift.y));
    if (dy < 0) {
      const bottom = lift.y - 0.15;
      if (cats.some(c => xzOver(c, lift.solid) && c.pos.y + H <= bottom + 0.02 && c.pos.y + H > bottom + dy - 0.02)) dy = 0;
    }
    const riders = cats.filter(c => c.groundRef === lift.solid && c.vel.y <= 0);
    lift.y += dy;
    lift.solid.min[1] = Math.max(0, lift.y - 0.15); lift.solid.max[1] = lift.y;
    riders.forEach(c => { c.pos.y = lift.y; c.vel.y = 0; });
    cats.forEach(c => { if (dy > 0 && overlap(catBox(c), lift.solid)) { c.pos.y = lift.y; c.vel.y = 0; } });
    liftGroup.position.set((LX0 + LX1) / 2, lift.y, (LZ0 + LZ1) / 2);
    if (switched && drawerT < 1) {
      drawerT = Math.min(1, drawerT + dt * 1.6);
      drawers.forEach(d => { d.mesh.position.z = 0.6 + ((d.z0 + d.z1) / 2 - 0.6) * drawerT; });
      if (drawerT >= 1) {
        drawers.forEach(d => { d.solid.active = true; cats.forEach(c => { if (overlap(catBox(c), d.solid)) { c.pos.y = d.h; c.vel.y = 0; } }); });
        blip([300, 420], 0.2, 'triangle', 0.08);
      }
    }
  };
  L.onPaw = c => {
    if (!switched && c.grounded && c.pos.y > 2.5 && Math.hypot(c.pos.x - 11.3, c.pos.z - 0.3) < 1.4) {
      switched = true; toggle.rotation.x = 0.5; lampLight.intensity = 1.1; lampShade.material = M.lamp; blip([660, 440], 0.15, 'square', 0.05);
    }
  };
  L.objective = () => {
    const up = anyCatOn(1.85, c => c.pos.x > 8.2 - R && c.pos.x < 14.4 + R && c.pos.z < 2 + R);
    if (switched) return 'The drawers make stairs now. Both cats into the basket on top of the wardrobe.';
    if (up) return 'Paw the light switch above the wardrobe (E, / or X) to pull out the drawers.';
    if (lift.y > 1) return 'Ride the laundry lift up to the wardrobe.';
    return 'One cat sits on the cushion plate to raise the laundry lift for the other.';
  };
  L.lift = lift;
  L.isSolved = () => switched;
  return L;
}

export { buildBedroom };
