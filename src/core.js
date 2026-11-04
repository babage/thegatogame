// ---------- Tunables ----------
const R = 0.32, H = 0.68;
const G = 28, JUMP_V = 8.6, SPEED = 4.6;
const mods = { jump: 1, speed: 1, magnet: 1, yarnMul: 1 };


// Shared, live game state read by several modules
const cats = [];
let level = null;
function setLevel(l) { level = l; }
let time = 0;
function advanceTime(dt) { time += dt; }

export { R, H, G, JUMP_V, SPEED, mods, cats, level, setLevel, time, advanceTime };
