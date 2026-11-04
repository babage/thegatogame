import { H, R, cats } from './core.js';
import { level } from './core.js';
// ---------- Physics ----------
const EPS = 1e-4;
const catBox = (c, y) => { const yy = y === undefined ? c.pos.y : y; return { min: [c.pos.x - R, yy, c.pos.z - R], max: [c.pos.x + R, yy + H, c.pos.z + R] }; };
const overlap = (a, b) => a.min[0] < b.max[0] - EPS && a.max[0] > b.min[0] + EPS && a.min[1] < b.max[1] - EPS && a.max[1] > b.min[1] + EPS && a.min[2] < b.max[2] - EPS && a.max[2] > b.min[2] + EPS;
function solidsFor(c) {
  const o = cats[1 - c.id];
  const list = level ? level.solids.filter(s => s.active) : [];
  list.push({ min: [o.pos.x - R, o.pos.y, o.pos.z - R], max: [o.pos.x + R, o.pos.y + H, o.pos.z + R], active: true, name: 'cat', cat: o });
  return list;
}
const blockedAt = (c, y, list) => { const b = catBox(c, y); return list.some(s => overlap(b, s)); };
function moveAxis(c, ax, d, list) {
  if (d === 0) return;
  const i = ax === 'x' ? 0 : ax === 'y' ? 1 : 2;
  c.pos[ax] += d;
  for (const s of list) {
    if (!overlap(catBox(c), s)) continue;
    if (i === 1) {
      if (d < 0) { c.pos.y = s.max[1]; c.vel.y = 0; c.grounded = true; c.groundRef = s; }
      else { c.pos.y = s.min[1] - H - EPS; c.vel.y = 0; }
    } else {
      const lift = s.max[1] - c.pos.y;
      if (lift > 0 && lift < 0.26 && !blockedAt(c, s.max[1] + EPS, list.filter(t => t !== s))) { c.pos.y = s.max[1]; if (c.vel.y < 0) c.vel.y = 0; continue; }
      if (s.pushable && c.grounded) c.push = { s, i, dir: Math.sign(d) };
      c.pos[ax] = d > 0 ? s.min[i] - R - EPS : s.max[i] + R + EPS;
      c.vel[ax] = 0;
    }
  }
}

export { EPS, catBox, overlap, solidsFor, blockedAt, moveAxis };
