import * as THREE from 'three';
import { canvas } from './dom.js';
// ---------- Renderer, scene, camera ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a2131');
const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
const CAM_DIR = new THREE.Vector3(1, 1.2, 1).normalize();
const camTarget = new THREE.Vector3(8, 0, 8);
const hemi = new THREE.HemisphereLight('#fff1dc', '#5b4560', 0.75);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe6c2', 0.85);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

const mat = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, extra || {}));
const M = {
  trim: mat('#f3e3cc'), wood: mat('#8a5a3a'), fence: mat('#f3e3cc'), gate: mat('#f0b45c'), carpet: mat('#b9a387'), post: mat('#d7c09a'),
  pot: mat('#c66a4a'), leaf: mat('#5f8f58'), book1: mat('#d9506d'), book2: mat('#4f7f7a'), book3: mat('#f0b45c'),
  plate: mat('#e9a6b5'), plateOn: mat('#ffd98a', { emissive: '#ffb347', emissiveIntensity: 0.6 }),
  pouf: mat('#e3825f'), yarn: mat('#e2647c'), lamp: mat('#fff0c9', { emissive: '#ffcf7a', emissiveIntensity: 0.9 }), dark: mat('#3b2f2a'),
  window: new THREE.MeshBasicMaterial({ color: '#ffe9b0' }), rug: mat('#4f7f7a'), rug2: mat('#e7c48a'),
  sofa: mat('#7a5c8e'), sofa2: mat('#8e6fa1'), counter: mat('#9fb8a4'), counterTop: mat('#f4efe6'), fridge: mat('#eef2f0'),
  bell: mat('#e8b84a', { metalness: 0.4, roughness: 0.35 }), bellOn: mat('#fff0a8', { emissive: '#ffd25a', emissiveIntensity: 0.9 }),
  goal: new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.35, depthWrite: false }),
  bed: mat('#efe6f5'), blanket: mat('#7f8fd0'), pillow: mat('#fff8ee'), wicker: mat('#c99a5b'), rope: mat('#e7d8bf'),
  water: new THREE.MeshStandardMaterial({ color: '#2f5f8f', roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.9 }),
  reed: mat('#6f8f4a'), moonGlow: new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.4, depthWrite: false }),
  trunk: mat('#8a4f3a'), band: mat('#d9a44a', { metalness: 0.3, roughness: 0.5 }), crate: mat('#c49a6c'), loft: mat('#9a6b48')
};
const DEFAULT_ENV = { bg: '#2a2131', hemi: '#fff1dc', ground: '#5b4560', hemiI: 0.75, sun: '#ffe6c2', sunI: 0.85 };
const tileTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#b9cdb6'; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.encoding = THREE.sRGBEncoding; return t;
})();

export { renderer, scene, camera, CAM_DIR, camTarget, hemi, sun, mat, M, DEFAULT_ENV, tileTex };
