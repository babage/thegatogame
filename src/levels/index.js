import { buildLiving } from './living.js';
import { buildKitchen } from './kitchen.js';
import { buildBedroom } from './bedroom.js';
import { buildGarden } from './garden.js';
import { buildAttic } from './attic.js';
import { buildSewing } from './sewing.js';
import { cats } from '../core.js';
import { level } from '../core.js';
const ROOMS = { living: buildLiving, kitchen: buildKitchen, bedroom: buildBedroom, garden: buildGarden, attic: buildAttic, sewing: buildSewing };
function updatePush(dt) {
  const p = level && level.pushable; if (!p) return;
  const a = cats[0].push, b = cats[1].push;
  const mine = c => c.push && c.push.s === p.solid;
  if (mine(cats[0]) && mine(cats[1]) && a.i === b.i && a.dir === b.dir) {
    p.move(a.i === 0 ? 'x' : 'z', a.dir * 1.7 * dt);
    p.strain = 0.6;
  } else if (mine(cats[0]) || mine(cats[1])) {
    if (level.onStrain) level.onStrain();
  }
}

export { ROOMS, updatePush };
