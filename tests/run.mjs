// Run `npm run build` first. Serves dist/ and drives the headless play-throughs.
// Needs Playwright with Chromium installed (globally or in this project).
import fs from 'fs';
import { spawn, execFile, execFileSync } from 'child_process';
import { promisify } from 'util';

const run = promisify(execFile);
const port = 4317;
const url = `http://localhost:${port}/`;

// The preview server indexes dist/ when it starts, so the stand-in cat must exist before then.
const glb = 'dist/models/cat.glb';
const standIn = !fs.existsSync(glb);
if (standIn) {
  fs.mkdirSync('dist/models', { recursive: true });
  execFileSync('node', ['tools/make-test-cat.mjs', glb]);
}

// Detached so the whole process group (npx and the vite it starts) can be stopped at the end.
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore', detached: true });
await new Promise(r => setTimeout(r, 2500));
const env = { ...process.env, NODE_PATH: execFileSync('npm', ['root', '-g']).toString().trim() };

let failed = false;
async function test(file, ...args) {
  console.log('\n== ' + file);
  try {
    const { stdout } = await run('node', ['tests/' + file, url, ...args], { env, timeout: 280000 });
    console.log(stdout);
    if (!/errors \[\]/.test(stdout)) failed = true;
  } catch (e) {
    failed = true;
    console.log(e.stdout || '', e.stderr || '', e.message);
  }
}

// The play-throughs run with the cat model loaded, which also checks it does not break physics.
await test('full-run.mjs', '', '', '/tmp');
await test('garden-attic.mjs', '', '', '/tmp');
await test('model.mjs');

process.kill(-server.pid);
if (standIn) fs.rmSync(glb);
console.log(failed ? '\nSOME TESTS FAILED' : '\nALL TESTS PASSED');
process.exit(failed ? 1 : 0);
