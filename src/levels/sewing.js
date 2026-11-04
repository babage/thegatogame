import { addBox, addMesh, addYarns, fenceWithGate, goalPad, newLevel, plant, rug, shell } from './helpers.js';
import { M, mat } from '../scene.js';
import * as THREE from 'three';
import { cats, time } from '../core.js';
import { blip } from '../audio.js';
// ---------- Room 6: the sewing room ----------
// The cats share one strand of yarn. It wraps around anything it is pulled across, and it
// only stretches so far. Wind it around all three thread spools to open the gate.

const MAX_LEN = 14;
const SPOOL_R = 0.32, SPOOL_H = 1.6;

const cross = (ax, az, bx, bz) => ax * bz - az * bx;
function inTriangle(p, a, b, c) {
  const d1 = cross(b.x - a.x, b.z - a.z, p.x - a.x, p.z - a.z);
  const d2 = cross(c.x - b.x, c.z - b.z, p.x - b.x, p.z - b.z);
  const d3 = cross(a.x - c.x, a.z - c.z, p.x - c.x, p.z - c.z);
  const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

// A strand between two moving ends that wraps around fixed pegs, seen from above.
// `wraps` runs from end 0 to end 1; each entry is a peg and the way the strand turns there,
// measured walking along the strand from end 0 to end 1.
function makeStrand(pegs) {
  const wraps = [];
  const pt = (ends, i) => ends[i];
  function points(ends) { return [pt(ends, 0), ...wraps.map(w => w.peg), pt(ends, 1)]; }
  function length(ends) {
    const p = points(ends);
    let len = 0;
    for (let i = 1; i < p.length; i++) len += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z);
    return len;
  }
  // Moves end `e` from `from` to `to`, adding and removing wraps on its side.
  function sweep(ends, e, from, to) {
    const inner = () => (wraps.length ? wraps[e === 0 ? 0 : wraps.length - 1].peg : ends[1 - e]);
    // Unwrap first: the strand has swung back past the peg it was bent around.
    for (let guard = 0; guard < 4 && wraps.length; guard++) {
      const w = wraps[e === 0 ? 0 : wraps.length - 1];
      const nIdx = e === 0 ? 1 : wraps.length - 2;
      const n = nIdx >= 0 && nIdx < wraps.length ? wraps[nIdx].peg : ends[1 - e];
      // turns are measured along the strand from end 0 to end 1
      const [p0, p2] = e === 0 ? [to, n] : [n, to];
      const turn = Math.sign(cross(w.peg.x - p0.x, w.peg.z - p0.z, p2.x - w.peg.x, p2.z - w.peg.z));
      if (turn !== 0 && turn !== w.side) { if (e === 0) wraps.shift(); else wraps.pop(); } else break;
    }
    const a = inner();
    const reach = Math.hypot(to.x - a.x, to.z - a.z);
    const hit = pegs.find(p => p !== a && Math.hypot(p.x - a.x, p.z - a.z) < reach && inTriangle(p, a, from, to) &&
      Math.abs(cross(from.x - a.x, from.z - a.z, to.x - a.x, to.z - a.z)) > 1e-6);
    if (hit) {
      const [p0, p2] = e === 0 ? [to, a] : [a, to];
      const side = Math.sign(cross(hit.x - p0.x, hit.z - p0.z, p2.x - hit.x, p2.z - hit.z)) || 1;
      if (e === 0) wraps.unshift({ peg: hit, side }); else wraps.push({ peg: hit, side });
      return true;
    }
    return false;
  }
  return { wraps, points, length, sweep };
}

function buildSewing() {
  const L = newLevel('sewing', 'The sewing room', 18, 12);
  L.env = { bg: '#2a2030', hemi: '#ffe8f0', ground: '#5a4652', hemiI: 0.62, sun: '#ffe2c8', sunI: 0.85 };
  shell(L, { floor: '#c79a7a', planks: '#b5876a', wallA: '#e6c9d2', wallB: '#dbbcc6' });
  // sewing table with the machine, a basket and a dress form along the back
  addBox(L, 1.2, 0, 0, 5.4, 1.0, 1.6, M.wood, { name: 'table' });
  addBox(L, 2.2, 1.0, 0.3, 3.6, 1.6, 1.1, mat('#e9e2d6'), { name: 'machine' });
  addBox(L, 3.4, 1.35, 0.5, 4.3, 1.55, 0.9, mat('#e9e2d6'), { solid: false });
  addBox(L, 0, 0, 3.0, 1.4, 0.7, 4.6, M.wicker, { name: 'basket' });
  addMesh(L, new THREE.CylinderGeometry(0.42, 0.32, 1.1, 16), mat('#f1d7dd'), 7.6, 1.15, 0.7);
  addMesh(L, new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), M.wood, 7.6, 0.3, 0.7);
  addBox(L, 7.2, 0, 0.3, 8.0, 1.7, 1.1, null, { name: 'dress-form' });
  rug(L, 8.6, 6.4, 4.6, 3.6, mat('#e7b7c4'));
  rug(L, 8.6, 6.4, 3.4, 2.6, mat('#f3d6de'), 0.004);
  plant(L, 13.2, 11.2, 0.85);

  // three big thread spools, each a peg the strand can wrap around
  const spoolColours = ['#e2647c', '#7fc8f8', '#f0b45c'];
  const pegs = [[6.0, 4.0], [8.6, 8.4], [11.2, 4.0]].map(([x, z], i) => {
    const threadMat = mat(spoolColours[i]);
    addMesh(L, new THREE.CylinderGeometry(SPOOL_R * 0.9, SPOOL_R * 0.9, SPOOL_H - 0.3, 18), threadMat, x, SPOOL_H / 2, z);
    [0.08, SPOOL_H - 0.08].forEach(y => addMesh(L, new THREE.CylinderGeometry(SPOOL_R + 0.14, SPOOL_R + 0.14, 0.16, 20), M.wood, x, y, z));
    L.solids.push({ min: [x - SPOOL_R, 0, z - SPOOL_R], max: [x + SPOOL_R, SPOOL_H, z + SPOOL_R], active: true, name: 'spool' });
    const glow = addMesh(L, new THREE.TorusGeometry(SPOOL_R + 0.2, 0.05, 8, 28), M.lamp, x, 0.04, z, false);
    glow.rotation.x = Math.PI / 2; glow.visible = false;
    return { x, z, glow, threadMat };
  });

  const gate = fenceWithGate(L, 14.4, 5, 7.2, 2.6);
  goalPad(L, 15.2, 4.2, 17.6, 8.0, 0);
  addMesh(L, new THREE.CylinderGeometry(0.9, 0.95, 0.18, 24), M.pillow, 16.4, 0.09, 6.1);
  addYarns(L, [[4.4, 1.3, 0.6], [0.7, 1.0, 3.8], [8.6, 0.3, 6.2], [12.6, 0.3, 1.2], [2.2, 0.3, 10.6], [16.4, 0.4, 2.0]]);
  L.spawns = [[3.0, 6.0], [3.8, 7.2]];

  // the strand, drawn as a chain of thin cylinders between its points
  const strand = makeStrand(pegs);
  const strandMat = mat('#e2647c', { emissive: '#e2647c', emissiveIntensity: 0.15 });
  const segGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
  segGeo.translate(0, 0.5, 0); segGeo.rotateX(Math.PI / 2);
  const segs = [];
  const seg = i => {
    if (!segs[i]) { const m = new THREE.Mesh(segGeo, strandMat); m.castShadow = true; L.group.add(m); segs[i] = m; }
    return segs[i];
  };
  const ends = () => cats.map(c => ({ x: c.pos.x, z: c.pos.z, y: c.pos.y }));
  let last = null, valid = null;
  let solved = false, taut = 0, freed = 0;

  L.update = () => {
    if (solved) return;
    const now = ends();
    // the cats are placed after the room is built, so start from wherever they first stand
    if (!last) { last = now; valid = now.map(p => ({ ...p })); return; }
    // move one end at a time, so each sweep is against the other end's settled spot
    for (let e = 0; e < 2; e++) {
      const view = [e === 0 ? now[0] : last[0], e === 1 ? now[1] : last[1]];
      if (strand.sweep(view, e, last[e], now[e])) blip([520 + e * 80, 700 + e * 80], 0.1, 'triangle', 0.04);
    }
    // too long: put back whichever cat pulled it past its length
    if (strand.length(now) > MAX_LEN) {
      for (let e = 0; e < 2; e++) {
        const trial = now.slice(); trial[e] = { ...valid[e], y: now[e].y };
        if (strand.length(trial) < strand.length(now)) {
          const c = cats[e];
          c.pos.x = valid[e].x; c.pos.z = valid[e].z; c.vel.x = 0; c.vel.z = 0;
          now[e] = trial[e];
        }
      }
      if (taut <= 0) blip([200, 170], 0.08, 'sine', 0.03);
      taut = 1;
    } else {
      valid = now.map(p => ({ ...p }));
      taut = Math.max(0, taut - 0.05);
    }
    last = now;
    const wound = new Set(strand.wraps.map(w => w.peg));
    if (wound.size === pegs.length) {
      solved = true; freed = 1;
      blip([523, 659, 784, 1046], 0.8, 'sine', 0.08);
    }
    gate.want = solved;
  };

  L.visual = () => {
    const wound = new Set(strand.wraps.map(w => w.peg));
    pegs.forEach(p => {
      p.glow.visible = wound.has(p) || solved;
      p.glow.scale.setScalar(1 + 0.08 * Math.sin(time * 5));
    });
    if (solved) {
      freed = Math.max(0, freed - 0.02);
      segs.forEach(s => { s.visible = freed > 0; s.scale.x = s.scale.y = freed; });
      return;
    }
    const pts = strand.points(ends());
    const ys = pts.map((p, i) => (i === 0 || i === pts.length - 1 ? cats[i === 0 ? 0 : 1].pos.y + 0.32 : 0.6));
    const wobble = taut > 0 ? Math.sin(time * 60) * 0.02 * taut : 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const m = seg(i); m.visible = true;
      const a = new THREE.Vector3(pts[i].x, ys[i] + wobble, pts[i].z), b = new THREE.Vector3(pts[i + 1].x, ys[i + 1], pts[i + 1].z);
      m.position.copy(a);
      m.scale.set(1 + taut * 0.4, 1 + taut * 0.4, Math.max(0.01, a.distanceTo(b)));
      m.lookAt(b);
    }
    for (let i = pts.length - 1; i < segs.length; i++) segs[i].visible = false;
    strandMat.emissiveIntensity = 0.15 + taut * 0.5;
  };

  L.objective = () => {
    if (solved) return 'The spools are wound and the yarn slips free! Both cats through the gate to the cushion.';
    const n = new Set(strand.wraps.map(w => w.peg)).size;
    if (taut > 0.5) return 'The yarn is stretched tight. The other cat has to come closer!';
    if (n === 0) return 'You share one strand of yarn. Wind it around all three spools to open the gate.';
    return `Wound around ${n} of 3 spools. Keep going, and keep close: the yarn only stretches so far.`;
  };
  L.isSolved = () => solved;
  L.strand = strand;
  L.maxLen = MAX_LEN;
  return L;
}

export { buildSewing };
