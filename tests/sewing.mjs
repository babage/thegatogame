// Plays the sewing room: wind the shared strand around all three spools, then reach the cushion.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const URL_ = process.argv[2];
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
await page.route('**/*', r => (r.request().url().startsWith(URL_) ? r.continue() : r.abort()));
await page.goto(URL_);
await page.waitForTimeout(800);
const G = (fn, arg) => page.evaluate(fn, arg);
await page.keyboard.press('KeyX');
await G(() => window.__gato.startRun(['sewing', 'living', 'kitchen']));
await page.waitForTimeout(600);
console.log('level', await G(() => window.__gato.level.key));
const info = () => G(() => { const L = window.__gato.level; return { wraps: L.strand.wraps.length, solved: L.isSolved(), len: +L.strand.length(window.__gato.cats.map(c => c.pos)).toFixed(2) }; });
// Glide a cat to (x, z) in small steps, so the strand sweeps across the spools as it would in play.
async function glide(i, x, z) {
  for (let n = 0; n < 200; n++) {
    const done = await G(([i, x, z]) => {
      const c = window.__gato.cats[i]; const dx = x - c.pos.x, dz = z - c.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.05) return true;
      const s = Math.min(0.25, d); c.pos.x += dx / d * s; c.pos.z += dz / d * s; c.vel.x = c.vel.z = 0; return false;
    }, [i, x, z]);
    if (done) return true;
    await page.waitForTimeout(45);
  }
  return false;
}
// The leash: one cat alone cannot pull the strand far past its length.
await glide(1, 17.4, 11.4);
const far = await info();
console.log('lone cat stopped by the strand', far.len <= 14.3, JSON.stringify(far), JSON.stringify(await G(() => window.__gato.cats[1].pos)));
await glide(1, 3.8, 7.2);
console.log('objective', await G(() => document.getElementById('objective').textContent));
// cat 0 waits by the first spool while cat 1 winds the strand around all three
await glide(0, 4.5, 3.0);
for (const [x, z] of [[7.5, 6], [7.5, 2.5], [7.5, 9.8], [11, 9.8]]) await glide(1, x, z);
console.log('after two spools', JSON.stringify(await info()));
await glide(0, 5.4, 3.6);
for (const [x, z] of [[12.5, 6], [12.5, 2.5], [10, 2.5]]) await glide(1, x, z);
const done = await info();
console.log('wound all three', JSON.stringify(done));
await page.waitForTimeout(800);
console.log('gate open', await G(() => window.__gato.level.gates[0].open.toFixed(2)));
await page.screenshot({ path: '/tmp/s_sewing.png' });
await G(() => { const [a, b] = window.__gato.cats; Object.assign(a.pos, { x: 16, y: 0, z: 5.4 }); Object.assign(b.pos, { x: 16.8, y: 0, z: 7 }); });
const finished = await page.waitForFunction(() => window.__gato.state !== 'play', null, { timeout: 15000 }).then(() => true, () => false);
console.log('sewing done', done.solved && finished, await G(() => window.__gato.state));
if (!done.solved || !finished || far.len > 14.3) errors.push('sewing room did not play through');
console.log('errors', JSON.stringify(errors));
await browser.close();
