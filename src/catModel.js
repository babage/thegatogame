// Loads a cat from a GLB file and drives it from the same state the placeholder cat uses.
// Works with rigged + animated models (clips are matched by name) and with plain static
// meshes, which get a procedural bob, lean, squash and sit instead.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MODEL } from './modelConfig.js';

const CLIP_PATTERNS = {
  idle: /idle|stand|breath/i,
  walk: /walk/i,
  run: /run|gallop|sprint/i,
  trot: /trot|jog|slow.?run/i,
  jump: /jump|leap|hop/i,
  sit: /sit/i
};

let cached = null;
export function loadCatModel(url) {
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      new GLTFLoader().load(url, resolve, undefined, reject);
    });
  }
  return cached;
}

export async function modelAvailable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    return res.ok && !type.includes('text/html');
  } catch (e) {
    return false;
  }
}

function findClips(animations) {
  const found = {};
  for (const [key, re] of Object.entries(CLIP_PATTERNS)) {
    const name = MODEL.clips && MODEL.clips[key];
    found[key] = name ? animations.find(a => a.name === name) : animations.find(a => re.test(a.name));
  }
  if (!found.run) found.run = found.trot || found.walk;
  if (!found.walk) found.walk = found.trot || found.run;
  return found;
}

// Builds one cat instance. `length` is the nose-to-tail size in game units.
export function createModelRig(gltf, { length = 0.95 } = {}) {
  const src = gltf.scene;
  const model = cloneSkinned(src);
  const holder = new THREE.Group();     // receives procedural motion
  const fit = new THREE.Group();        // scale + orientation fix for the asset
  fit.add(model);
  holder.add(fit);
  fit.rotation.y = THREE.MathUtils.degToRad(MODEL.yawDegrees || 0);

  // Normalise size: the longest horizontal side becomes `length`, feet sit on y = 0.
  fit.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fit);
  const size = box.getSize(new THREE.Vector3());
  const scale = (length * (MODEL.scale || 1)) / Math.max(size.x, size.z, 1e-6);
  fit.scale.setScalar(scale);
  fit.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(fit);
  const centre = box2.getCenter(new THREE.Vector3());
  fit.position.set(-centre.x, -box2.min.y, -centre.z);
  const height = box2.max.y - box2.min.y;

  const materials = [];
  model.traverse(o => {
    if (o.isMesh || o.isSkinnedMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const own = mats.map(m => {
        const c = m.clone();
        c.userData.baseColor = c.color ? c.color.clone() : null;
        return c;
      });
      o.material = Array.isArray(o.material) ? own : own[0];
      materials.push(...own);
    }
  });

  // Where hats go: a head bone if the rig has one, otherwise the top front of the model.
  let headBone = null;
  model.traverse(o => { if (!headBone && o.isBone && /head/i.test(o.name)) headBone = o; });
  const hatAnchor = new THREE.Group();
  if (headBone) {
    headBone.add(hatAnchor);
    holder.updateMatrixWorld(true);
    const ws = headBone.getWorldScale(new THREE.Vector3());
    hatAnchor.scale.set(1 / ws.x, 1 / ws.y, 1 / ws.z);
    hatAnchor.position.y = (MODEL.hatLift || 0) / ws.y;
  } else {
    hatAnchor.position.set(0, height * 0.95, length * 0.38);
    holder.add(hatAnchor);
  }

  const clips = findClips(gltf.animations || []);
  const animated = !!(clips.idle || clips.walk || clips.run);
  const mixer = animated ? new THREE.AnimationMixer(model) : null;
  const actions = {};
  if (mixer) for (const [k, clip] of Object.entries(clips)) if (clip) actions[k] = mixer.clipAction(clip);
  if (actions.jump) { actions.jump.setLoop(THREE.LoopOnce, 1); actions.jump.clampWhenFinished = true; }
  if (actions.sit) { actions.sit.setLoop(THREE.LoopOnce, 1); actions.sit.clampWhenFinished = true; }
  let current = null;
  const play = (key, fade = 0.2) => {
    const next = actions[key] || actions.idle || actions.walk;
    if (!next || next === current) return;
    next.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (current) current.fadeOut(fade);
    current = next;
  };
  if (mixer) play('idle', 0);

  let bob = 0;
  return {
    object: holder,
    hatAnchor,
    animated,
    clipNames: (gltf.animations || []).map(a => a.name),
    // Tints the textures toward a coat colour; white keeps the original look.
    setCoat(hex) {
      const tint = new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.45);
      materials.forEach(m => { if (m.userData.baseColor) m.color.copy(m.userData.baseColor).multiply(tint); });
    },
    // state: { speed, maxSpeed, air, vy, sitT, squash, pawT, dt, time }
    update(st) {
      const k = Math.min(1, st.speed / st.maxSpeed);
      if (mixer) {
        if (st.air && actions.jump) play('jump', 0.1);
        else if (st.sitT > 0.5 && actions.sit) play('sit', 0.25);
        else if (k > 0.7 && actions.run) play('run');
        else if (k > 0.08) play('walk');
        else play('idle');
        if (current && (current === actions.walk || current === actions.run)) current.timeScale = 0.6 + k * 0.8;
        mixer.update(st.dt);
      }
      // Procedural layer: always adds squash and the sit pose; adds a gait bob when there are no clips.
      bob += st.speed * st.dt * 3.4;
      const gait = mixer ? 0 : Math.abs(Math.sin(bob)) * 0.05 * k;
      const s = st.squash;
      holder.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      const sitLift = actions.sit ? 0 : st.sitT;
      holder.rotation.x = -0.35 * sitLift + (mixer ? 0 : (st.air ? -0.25 * Math.sign(st.vy) : Math.sin(bob * 2) * 0.04 * k));
      holder.position.set(0, gait - 0.05 * sitLift, -0.08 * sitLift);
      holder.rotation.z = mixer ? 0 : Math.sin(bob) * 0.05 * k;
    }
  };
}
