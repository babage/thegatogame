import { srcEls } from './dom.js';
// ---------- Input ----------
const down = new Set(), pressed = new Set();
const GAME_KEYS = new Set(['Escape', 'KeyM', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyE', 'KeyQ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'NumpadEnter', 'ShiftRight', 'Slash', 'Period', 'KeyR']);
const NAV_PREV = new Set(['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA']), NAV_NEXT = new Set(['ArrowDown', 'ArrowRight', 'KeyS', 'KeyD']);

const KEYMAP = [
  { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], jump: ['Space'], sit: ['ShiftLeft'], paw: ['KeyE'], meow: ['KeyQ'] },
  { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['Enter', 'NumpadEnter'], sit: ['ShiftRight'], paw: ['Slash'], meow: ['Period'] }
];
const any = (set, codes) => codes.some(k => set.has(k));
const padMem = {};
function pollPads() {
  let pads = [];
  try { pads = Array.from((navigator.getGamepads && navigator.getGamepads()) || []).filter(p => p && p.connected); } catch (e) { pads = []; }
  return pads.map(pad => {
    const mem = padMem[pad.index] || (padMem[pad.index] = { prev: [], stick: 0 });
    const cur = pad.buttons.map(b => !!(b && b.pressed));
    const edge = cur.map((v, i) => v && !mem.prev[i]);
    mem.prev = cur;
    const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    const dir = (ax > 0.6 || ay > 0.6) ? 1 : (ax < -0.6 || ay < -0.6) ? -1 : 0;
    let nav = dir !== 0 && dir !== mem.stick ? dir : 0; mem.stick = dir;
    if (edge[12] || edge[14]) nav = -1; if (edge[13] || edge[15]) nav = 1;
    return { pad, cur, edge, nav, accept: !!edge[0], anyEdge: edge.some(Boolean) };
  });
}
function readInputs(polled) {
  const assign = polled.length >= 2 ? [polled[0], polled[1]] : [null, polled[0] || null];
  const out = [0, 1].map(i => {
    const k = KEYMAP[i];
    let sx = (any(down, k.right) ? 1 : 0) - (any(down, k.left) ? 1 : 0);
    let sy = (any(down, k.down) ? 1 : 0) - (any(down, k.up) ? 1 : 0);
    let jumpHeld = any(down, k.jump), jumpPressed = any(pressed, k.jump);
    let sit = any(down, k.sit), paw = any(pressed, k.paw), meow = any(pressed, k.meow), restart = pressed.has('KeyR'), pause = false;
    const p = assign[i];
    if (p) {
      let ax = p.pad.axes[0] || 0, ay = p.pad.axes[1] || 0;
      const mag = Math.hypot(ax, ay);
      if (mag < 0.18) { ax = 0; ay = 0; } else { const s = Math.min(1, (mag - 0.18) / 0.72) / mag; ax *= s; ay *= s; }
      if (p.cur[12]) ay = -1; if (p.cur[13]) ay = 1; if (p.cur[14]) ax = -1; if (p.cur[15]) ax = 1;
      if (Math.abs(ax) > Math.abs(sx)) sx = ax;
      if (Math.abs(ay) > Math.abs(sy)) sy = ay;
      jumpHeld = jumpHeld || !!p.cur[0]; jumpPressed = jumpPressed || !!p.edge[0];
      sit = sit || !!p.cur[1]; paw = paw || !!p.edge[2]; meow = meow || !!p.edge[3]; restart = restart || !!p.edge[8]; pause = pause || !!p.edge[9];
    }
    const mag = Math.hypot(sx, sy); if (mag > 1) { sx /= mag; sy /= mag; }
    // Isometric mapping: screen up is world (-x, -z), screen right is world (+x, -z)
    const mx = Math.SQRT1_2 * (sx + sy), mz = Math.SQRT1_2 * (sy - sx);
    return { mx, mz, jumpHeld, jumpPressed, sit, paw, meow, restart, pause };
  });
  srcEls[0].textContent = assign[0] ? 'gamepad + keyboard' : 'keyboard'; srcEls[0].classList.toggle('live', !!assign[0]);
  srcEls[1].textContent = assign[1] ? 'gamepad' : 'arrows, or plug in a pad'; srcEls[1].classList.toggle('live', !!assign[1]);
  pressed.clear();
  return out;
}

export { down, pressed, GAME_KEYS, NAV_PREV, NAV_NEXT, KEYMAP, any, padMem, pollPads, readInputs };
