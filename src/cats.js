import { createModelRig } from './catModel.js';
import * as THREE from 'three';
import { mat, scene } from './scene.js';
import { cats } from './core.js';
import { COATS, save } from './save.js';
// ---------- Cats ----------
function makeHat(id) {
  const g = new THREE.Group();
  if (id === 'party') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 16), mat('#7fc8f8')); cone.position.y = 0.3; g.add(cone);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 6, 16), mat('#ffd98a')); band.rotation.x = Math.PI / 2; band.position.y = 0.26; g.add(band);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat('#e2647c')); pom.position.y = 0.45; g.add(pom);
    g.rotation.z = 0.25;
  } else if (id === 'beanie') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d9506d')); dome.position.y = 0.07; dome.scale.set(1.05, 0.8, 1); g.add(dome);
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.04, 8, 20), mat('#f3e3cc')); brim.rotation.x = Math.PI / 2; brim.position.y = 0.08; g.add(brim);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('#f3e3cc')); pom.position.y = 0.25; g.add(pom);
  } else if (id === 'wizard') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 16), mat('#3d4a8f')); cone.position.y = 0.33; cone.rotation.z = -0.15; g.add(cone);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20), mat('#3d4a8f')); brim.position.y = 0.13; g.add(brim);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), mat('#ffd98a', { emissive: '#ffd25a', emissiveIntensity: 0.6 })); star.position.set(0.04, 0.33, 0.12); g.add(star);
  } else if (id === 'crown') {
    const gold = mat('#f0c050', { metalness: 0.5, roughness: 0.35 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.07, 16, 1, true), gold); band.position.y = 0.19; g.add(band);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2, sp = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), gold); sp.position.set(Math.cos(a) * 0.12, 0.26, Math.sin(a) * 0.12); g.add(sp); }
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat('#e2647c')); gem.position.set(0, 0.19, 0.125); g.add(gem);
  } else if (id === 'flower') {
    const cols = ['#ffd98a', '#f29aa8', '#ffffff'];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, f = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat(cols[i % 3]));
      f.position.set(Math.cos(a) * 0.17, 0.13, Math.sin(a) * 0.15); g.add(f);
    }
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeCat(collar) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const coatM = mat('#e8955a'), bellyM = mat('#fbe3c8'), dark = mat('#2b2026'), pink = mat('#f29aa8'), collarM = mat(collar, { emissive: collar, emissiveIntensity: 0.15 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 6, 14), coatM); torso.rotation.x = Math.PI / 2; torso.position.set(0, 0.36, -0.02); body.add(torso);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), bellyM); chest.position.set(0, 0.33, 0.22); chest.scale.set(1, 1.05, 0.7); body.add(chest);
  const head = new THREE.Group(); head.position.set(0, 0.56, 0.36); body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), coatM); skull.scale.set(1.05, 0.92, 0.95); head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), bellyM); muzzle.position.set(0, -0.06, 0.15); muzzle.scale.set(1.3, 0.8, 0.8); head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), pink); nose.position.set(0, -0.025, 0.215); head.add(nose);
  [-1, 1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), dark); eye.position.set(0.075 * s, 0.03, 0.17); head.add(eye);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.17, 4), coatM); ear.position.set(0.11 * s, 0.17, -0.01); ear.rotation.set(-0.1, Math.PI / 4, 0.28 * -s); head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), pink); inner.position.set(0.105 * s, 0.155, 0.03); inner.rotation.set(-0.1, Math.PI / 4, 0.28 * -s); head.add(inner);
  });
  const collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 20), collarM); collarMesh.position.set(0, 0.45, 0.3); collarMesh.rotation.x = Math.PI / 2 - 0.5; body.add(collarMesh);
  const legs = [];
  [[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.22], [0.1, -0.22]].forEach(([x, z]) => {
    const hip = new THREE.Group(); hip.position.set(x, 0.3, z); body.add(hip);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8), coatM); leg.position.y = -0.15; hip.add(leg);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), bellyM); paw.position.set(0, -0.29, 0.02); paw.scale.set(1, 0.6, 1.2); hip.add(paw);
    legs.push(hip);
  });
  const tail = new THREE.Group(); tail.position.set(0, 0.44, -0.33); body.add(tail);
  let seg = tail; const tailSegs = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(); g.position.set(0, i === 0 ? 0 : 0.14, 0); seg.add(g);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04 - i * 0.004, 0.045 - i * 0.004, 0.16, 8), coatM); m.position.y = 0.07; g.add(m);
    tailSegs.push(g); seg = g;
  }
  root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.24, 3), new THREE.MeshBasicMaterial({ color: collar })); marker.rotation.x = Math.PI; scene.add(marker);
  scene.add(root);
  return { root, body, head, legs, tail, tailSegs, marker, coatM, bellyM, hat: null };
}
cats.push(
  { id: 0, name: 'Marmalade', parts: makeCat('#3fb3a6') },
  { id: 1, name: 'Smoke', parts: makeCat('#e8566e') }
);
function dressCats() {
  cats.forEach((c, i) => {
    const w = save.wear[i], coat = COATS.find(x => x.id === w.coat) || COATS[i];
    c.parts.coatM.color.set(coat.coat); c.parts.bellyM.color.set(coat.belly);
    if (c.model) c.model.setCoat(coat.coat);
    if (c.parts.hat) { c.parts.hat.removeFromParent(); c.parts.hat = null; }
    if (w.hat && w.hat !== 'none') { c.parts.hat = makeHat(w.hat); (c.model ? c.model.hatAnchor : c.parts.head).add(c.parts.hat); }
  });
}
function resetCat(c, spawn) {
  const [x, z] = spawn;
  Object.assign(c, {
    pos: { x, y: 0, z }, vel: { x: 0, y: 0, z: 0 }, prev: { x, y: 0, z }, lastDelta: { x: 0, z: 0 },
    grounded: true, groundRef: null, coyote: 0, jumpBuf: 0, sitting: false, sitT: 0, facing: -Math.PI * 0.75,
    walk: 0, squash: 1, pawT: 0, meowT: 0, wasGrounded: true, push: null, safe: { x, y: 0, z }
  });
}
cats.forEach(c => resetCat(c, [3 + c.id * 2, 8]));

// Swap the placeholder bodies for a loaded GLB cat.
function attachModel(gltf) {
  cats.forEach(c => {
    const rig = createModelRig(gltf);
    c.parts.root.add(rig.object);
    c.parts.body.visible = false;
    c.model = rig;
  });
  dressCats();
  return cats[0].model;
}

export { attachModel, makeHat, makeCat, dressCats, resetCat };
