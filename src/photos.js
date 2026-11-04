import * as THREE from 'three';
import { renderer, scene } from './scene.js';
// ---------- Dream photos ----------
// When both cats reach a room's goal they pose and get their picture taken. Photos are kept in
// their own storage key (they are much bigger than the save), newest last, up to MAX_KEPT.

const KEY = 'gato-photos-v1';
const MAX_KEPT = 16;
const W = 480, H = 360, SS = 2; // rendered at twice the size, then scaled down for smooth edges

let photos = [];
try { photos = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { photos = []; }
if (!Array.isArray(photos)) photos = [];

function store() {
  // drop the oldest photos until the album fits in storage
  while (photos.length) {
    try { localStorage.setItem(KEY, JSON.stringify(photos)); return; } catch (e) { photos.shift(); }
  }
  try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
}

const rt = new THREE.WebGLRenderTarget(W * SS, H * SS);
rt.texture.encoding = THREE.sRGBEncoding;
// a slightly lower, closer angle than the play camera: more portrait, less map
const PHOTO_DIR = new THREE.Vector3(1, 0.85, 1.25).normalize();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const big = document.createElement('canvas'); big.width = W * SS; big.height = H * SS;
const small = document.createElement('canvas'); small.width = W; small.height = H;

// Renders the two cats from the photo camera and returns a JPEG data URL.
function takePhoto(cats) {
  const a = cats[0].pos, b = cats[1].pos;
  const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.45, (a.z + b.z) / 2);
  const spread = Math.hypot(a.x - b.x, a.z - b.z, a.y - b.y);
  const half = Math.max(1.25, spread * 0.6 + 0.8);
  cam.left = -half * (W / H); cam.right = half * (W / H); cam.top = half; cam.bottom = -half;
  cam.updateProjectionMatrix();
  cam.position.copy(mid).addScaledVector(PHOTO_DIR, 60);
  cam.lookAt(mid);
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(scene, cam);
  const px = new Uint8Array(W * SS * H * SS * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, W * SS, H * SS, px);
  renderer.setRenderTarget(prev);
  // the pixels come out bottom row first
  const g = big.getContext('2d'), img = g.createImageData(W * SS, H * SS), row = W * SS * 4;
  for (let y = 0; y < H * SS; y++) img.data.set(px.subarray((H * SS - 1 - y) * row, (H * SS - y) * row), y * row);
  g.putImageData(img, 0, 0);
  const s = small.getContext('2d');
  s.imageSmoothingQuality = 'high';
  s.drawImage(big, 0, 0, W, H);
  return small.toDataURL('image/jpeg', 0.82);
}

function addPhoto(src, room, dream) {
  const p = { src, room, dream, at: Date.now() };
  photos.push(p);
  while (photos.length > MAX_KEPT) photos.shift();
  store();
  return p;
}

// Some hosts block data: images, so photos are shown through blob URLs.
const urls = new Map();
function photoURL(src) {
  if (!urls.has(src)) {
    const bin = atob(src.slice(src.indexOf(',') + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    urls.set(src, URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })));
  }
  return urls.get(src);
}

const allPhotos = () => photos;

export { takePhoto, addPhoto, allPhotos, photoURL };
