// Writes a tiny stand-in cat GLB (boxes + named node animations) for testing the model loader.
import fs from 'fs';
const out = process.argv[2] || 'test-cat.glb';
const boxes = [ // [cx, cy, cz, sx, sy, sz, r, g, b]
  [0, 0.35, 0, 0.36, 0.3, 0.8, 0.75, 0.55, 0.35],     // body
  [0, 0.58, 0.48, 0.3, 0.28, 0.26, 0.8, 0.6, 0.4],    // head (nose to +z)
  [0, 0.45, -0.55, 0.08, 0.08, 0.35, 0.5, 0.35, 0.25] // tail
];
const pos = [], nor = [], col = [], idx = [];
const faces = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, 1], [-1, 0, 0]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
for (const [cx, cy, cz, sx, sy, sz, r, g, b] of boxes) {
  for (const [n, u, v] of faces) {
    const base = pos.length / 3;
    for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const p = [0, 1, 2].map(i => n[i] * 0.5 + u[i] * a * 0.5 + v[i] * c * 0.5);
      pos.push(cx + p[0] * sx, cy + p[1] * sy, cz + p[2] * sz); nor.push(...n); col.push(r, g, b);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}
const f32 = a => Buffer.from(new Float32Array(a).buffer);
const times = [0, 0.25, 0.5];
const anims = { Idle: [[0, 0, 0], [0, 0.01, 0], [0, 0, 0]], Walk: [[0, 0, 0], [0, 0.05, 0], [0, 0, 0]], Run: [[0, 0, 0], [0, 0.1, 0], [0, 0, 0]], Jump: [[0, 0, 0], [0, 0.15, 0], [0, 0.05, 0]] };
const chunks = [f32(pos), f32(nor), f32(col), Buffer.from(new Uint16Array(idx).buffer), f32(times)];
const animBufs = Object.values(anims).map(v => f32(v.flat()));
chunks.push(...animBufs);
let offset = 0; const views = [];
const bin = Buffer.concat(chunks.map(c => { const pad = (4 - (c.length % 4)) % 4; views.push({ buffer: 0, byteOffset: offset, byteLength: c.length }); offset += c.length + pad; return Buffer.concat([c, Buffer.alloc(pad)]); }));
const mins = [0, 1, 2].map(i => Math.min(...pos.filter((_, j) => j % 3 === i))), maxs = [0, 1, 2].map(i => Math.max(...pos.filter((_, j) => j % 3 === i)));
const accessors = [
  { bufferView: 0, componentType: 5126, count: pos.length / 3, type: 'VEC3', min: mins, max: maxs },
  { bufferView: 1, componentType: 5126, count: nor.length / 3, type: 'VEC3' },
  { bufferView: 2, componentType: 5126, count: col.length / 3, type: 'VEC3' },
  { bufferView: 3, componentType: 5123, count: idx.length, type: 'SCALAR' },
  { bufferView: 4, componentType: 5126, count: 3, type: 'SCALAR', min: [0], max: [0.5] },
  ...animBufs.map((_, i) => ({ bufferView: 5 + i, componentType: 5126, count: 3, type: 'VEC3' }))
];
const gltf = {
  asset: { version: '2.0', generator: 'gato test cat' },
  scene: 0, scenes: [{ nodes: [0] }],
  nodes: [{ name: 'Cat', mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0 }] }],
  materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], roughnessFactor: 0.8, metallicFactor: 0 } }],
  animations: Object.keys(anims).map((name, i) => ({ name, samplers: [{ input: 4, output: 5 + i, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }] })),
  buffers: [{ byteLength: bin.length }], bufferViews: views, accessors
};
let json = Buffer.from(JSON.stringify(gltf)); json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
const ch = (buf, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(buf.length, 0); h.writeUInt32LE(type, 4); return Buffer.concat([h, buf]); };
fs.writeFileSync(out, Buffer.concat([header, ch(json, 0x4e4f534a), ch(bin, 0x004e4942)]));
console.log('wrote', out);
