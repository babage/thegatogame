// Checks that a GLB at dist/models/cat.glb replaces the placeholder cats and its clips play.
import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const url = process.argv[2];
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
await p.route('**/*', r => r.request().url().startsWith(url) ? r.continue() : r.abort());
await p.goto(url, { waitUntil: 'domcontentloaded' });
const ok = await p.waitForFunction(() => window.__gato && window.__gato.cats[0].model, null, { timeout: 20000 }).then(() => true, () => false);
console.log('model attached', ok);
if (ok) {
  await p.keyboard.press('KeyX');
  await p.evaluate(() => window.__gato.startRun(['living', 'kitchen', 'bedroom']));
  await p.keyboard.down('KeyD'); await p.waitForTimeout(800); await p.keyboard.up('KeyD');
  console.log('clips', await p.evaluate(() => window.__gato.cats[0].model.clipNames.join(',')));
}
console.log('errors', JSON.stringify(errors));
await b.close();
process.exit(ok && !errors.length ? 0 : 1);
