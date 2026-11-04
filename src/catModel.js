// Loads a cat from a GLB file and drives it from the same state the placeholder cat uses.
// Works with rigged + animated models (clips are matched by name) and with plain static
// meshes, which get a procedural bob, lean, squash and sit instead. A rigged model with no
// walk clip gets its leg bones swung from code while it moves.
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

// Recolours the fur on the texture: pixels in the model's own fur hue band take the coat colour,
// keeping their light and dark stripes. White patches, eyes, noses and paw pads stay as they are.
const SWAP_GLSL = `
uniform vec3 gatoCoat;
uniform float gatoSwap;
uniform vec4 gatoBand;
vec3 gatoRecolour(vec3 lin) {
  vec3 c = pow(max(lin, vec3(0.0)), vec3(1.0 / 2.2));
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), d = mx - mn;
  float sat = mx > 0.0 ? d / mx : 0.0;
  float hue = 0.0;
  if (d > 1e-4) {
    if (mx == c.r) hue = 60.0 * mod((c.g - c.b) / d, 6.0);
    else if (mx == c.g) hue = 60.0 * ((c.b - c.r) / d + 2.0);
    else hue = 60.0 * ((c.r - c.g) / d + 4.0);
  }
  if (hue > 180.0) hue -= 360.0;
  float w = smoothstep(0.12, 0.3, sat) * smoothstep(gatoBand.x - 6.0, gatoBand.x, hue) * (1.0 - smoothstep(gatoBand.y, gatoBand.y + 8.0, hue));
  float lum = dot(lin, vec3(0.2126, 0.7152, 0.0722));
  return mix(lin, gatoCoat * clamp(lum / gatoBand.z, 0.0, 2.2), w * gatoSwap);
}
`;

function addCoatSwap(material, swap) {
  const uniforms = {
    gatoCoat: { value: new THREE.Color('#ffffff') },
    gatoSwap: { value: 0 },
    gatoBand: { value: new THREE.Vector4(swap.hueMin, swap.hueMax, swap.furLuminance, 0) }
  };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', SWAP_GLSL + 'void main() {')
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vUv );
  sampledDiffuseColor.rgb = gatoRecolour( sampledDiffuseColor.rgb );
  diffuseColor *= sampledDiffuseColor;
#endif`);
  };
  material.customProgramCacheKey = () => 'gato-coat-swap';
  material.userData.coatSwap = uniforms;
}

// A URL ending in .b64.txt holds the GLB as base64 text, for hosts that won't serve .glb files.
let cached = null;
export function loadCatModel(url) {
  if (!cached) {
    const loader = new GLTFLoader();
    cached = url.endsWith('.b64.txt')
      ? fetch(url).then(r => r.text()).then(text => {
        const bin = atob(text.trim());
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Promise((resolve, reject) => loader.parse(bytes.buffer, '', resolve, reject));
      })
      : new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
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

// Upper leg bones for the procedural walk, from the config or guessed from bone names.
// Diagonal pairs move together, like a trotting cat.
function findLegs(model) {
  const cfg = (MODEL.gait && MODEL.gait.legs) || {};
  const bones = [];
  model.traverse(o => { if (o.isBone) bones.push(o); });
  const byName = n => bones.find(b => b.name === n);
  const guess = (side, end) => bones.find(b => {
    const n = b.name;
    const sideOk = side === 'l' ? /(^|[^a-z])(l|left)([^a-z]|$)/i.test(n) : /(^|[^a-z])(r|right)([^a-z]|$)/i.test(n);
    const endOk = end === 'front' ? /front|fore/i.test(n) : /hind|rear|back/i.test(n);
    return sideOk && endOk && /hip|thigh|upper/i.test(n);
  });
  const legs = [
    { bone: cfg.lf ? byName(cfg.lf) : guess('l', 'front'), phase: 0, front: true },
    { bone: cfg.rh ? byName(cfg.rh) : guess('r', 'hind'), phase: 0, front: false },
    { bone: cfg.rf ? byName(cfg.rf) : guess('r', 'front'), phase: Math.PI, front: true },
    { bone: cfg.lh ? byName(cfg.lh) : guess('l', 'hind'), phase: Math.PI, front: false }
  ];
  return legs.every(l => l.bone) ? legs : [];
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
        if (MODEL.coatSwap && c.map) addCoatSwap(c, MODEL.coatSwap);
        return c;
      });
      o.material = Array.isArray(o.material) ? own : own[0];
      materials.push(...own);
    }
  });

  // Where hats go: a head bone if the rig has one, otherwise the top front of the model.
  let headBone = MODEL.headBone ? model.getObjectByName(MODEL.headBone) : null;
  if (!headBone) model.traverse(o => { if (!headBone && o.isBone && /head/i.test(o.name)) headBone = o; });
  const hatAnchor = new THREE.Group();
  const hatScale = MODEL.hatScale || 1;
  if (headBone) {
    // Undo the bone's own rest rotation and scale, so hats stand upright at game size
    // and then follow the head as it moves.
    headBone.add(hatAnchor);
    holder.updateMatrixWorld(true);
    const ws = headBone.getWorldScale(new THREE.Vector3());
    const toBone = headBone.getWorldQuaternion(new THREE.Quaternion()).invert();
    hatAnchor.quaternion.copy(toBone);
    hatAnchor.scale.set(hatScale / ws.x, hatScale / ws.y, hatScale / ws.z);
    const off = new THREE.Vector3(...(MODEL.hatOffset || [0, 0.1, 0])).applyQuaternion(toBone);
    hatAnchor.position.set(off.x / ws.x, off.y / ws.y, off.z / ws.z);
  } else {
    hatAnchor.scale.setScalar(hatScale);
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

  // Bone layer: code-driven rotations added on top of whatever the clips do each frame.
  // Each entry is an [x, y, z] angle offset in the bone's own space, summed from every source.
  const AXES = { x: 0, y: 1, z: 2 };
  const touched = new Map();
  const boneSlot = bone => {
    if (!touched.has(bone)) touched.set(bone, { bone, sum: [0, 0, 0], undo: new THREE.Quaternion() });
    return touched.get(bone);
  };
  const addTurn = (slot, v, w) => { for (let i = 0; i < 3; i++) slot.sum[i] += v[i] * w; };
  const named = n => {
    const b = model.getObjectByName(n);
    if (!b) console.warn('Cat model: no bone named', n);
    return b;
  };

  // Procedural legs, only when the model has no walk clip of its own.
  const legs = clips.walk ? [] : findLegs(model);
  const swingAxis = AXES[(MODEL.gait && MODEL.gait.axis) || 'x'];
  const swing = (MODEL.gait && MODEL.gait.swing) || 0.55;
  legs.forEach(l => { l.slot = boneSlot(l.bone); });
  const legsWalk = legs.length > 0;

  // Poses blended in by game state: sit, paw and meow. `lift` (model units) lowers the body.
  const poses = {};
  for (const [key, def] of Object.entries(MODEL.poses || {})) {
    const bones = Object.entries(def.bones || {}).map(([n, v]) => ({ bone: named(n), v })).filter(e => e.bone);
    bones.forEach(e => { e.slot = boneSlot(e.bone); });
    poses[key] = { bones, lift: (def.lift || 0) * scale };
  }
  const tailCfg = MODEL.tail || {};
  const tail = (tailCfg.bones || []).map(named).filter(Boolean).map(b => boneSlot(b));
  const tailAxis = AXES[tailCfg.axis || 'x'];
  const sitPose = !!poses.sit && !actions.sit;

  let stride = 0, airPose = 0, pawW = 0, meowW = 0;
  let bob = 0;
  return {
    object: holder,
    hatAnchor,
    animated,
    clipNames: (gltf.animations || []).map(a => a.name),
    legsWalk,
    poses: Object.keys(poses),
    // Changes the fur to a coat colour. The model's own coat keeps the texture as it is.
    // Textures with `coatSwap` set are recoloured; anything else is tinted.
    setCoat(hex, id) {
      const native = id && id === MODEL.nativeCoat;
      const tint = native ? new THREE.Color('#ffffff') : new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.45);
      materials.forEach(m => {
        const swap = m.userData.coatSwap;
        if (swap) {
          swap.gatoCoat.value.set(hex).convertSRGBToLinear();
          swap.gatoSwap.value = native ? 0 : 1;
        } else if (m.userData.baseColor) {
          m.color.copy(m.userData.baseColor).multiply(tint);
        }
      });
    },
    // state: { speed, maxSpeed, air, vy, sitT, squash, pawT, meowT, dt, time }
    update(st) {
      const k = Math.min(1, st.speed / st.maxSpeed);
      // Take last frame's offsets back off, so they never pile up on bones the clip does not drive.
      touched.forEach(t => t.bone.quaternion.multiply(t.undo));
      if (mixer) {
        if (st.air && actions.jump) play('jump', 0.1);
        else if (st.sitT > 0.5 && actions.sit) play('sit', 0.25);
        else if (k > 0.7 && actions.run) play('run');
        else if (k > 0.08) play('walk');
        else play('idle');
        if (current && (current === actions.walk || current === actions.run)) current.timeScale = 0.6 + k * 0.8;
        mixer.update(st.dt);
      }
      // Procedural layer: always adds squash and the sit pose; adds a gait bob when nothing animates the walk.
      bob += st.speed * st.dt * 3.4;
      const ease = Math.min(1, st.dt * 10);
      stride += ((st.air ? 0 : k) * (1 - st.sitT) - stride) * ease;
      airPose += ((st.air ? 1 : 0) - airPose) * ease;
      // Paw and meow rise and fall over their timers (0.32 s and 0.5 s in the game).
      pawW = st.pawT > 0 ? Math.sin(Math.min(1, st.pawT / 0.32) * Math.PI) : 0;
      meowW = st.meowT > 0 ? Math.sin(Math.min(1, st.meowT / 0.5) * Math.PI) : 0;

      touched.forEach(t => { t.sum[0] = t.sum[1] = t.sum[2] = 0; });
      legs.forEach(l => {
        // Swing while walking; in the air the front paws reach forward and the back legs stretch out.
        const v = [0, 0, 0];
        v[swingAxis] = swing * stride * Math.sin(bob + l.phase) + airPose * (l.front ? 0.5 : -0.45);
        addTurn(l.slot, v, 1);
      });
      const weights = { sit: sitPose ? st.sitT : 0, paw: pawW, meow: meowW };
      for (const [key, w] of Object.entries(weights)) {
        if (poses[key] && w > 0.001) poses[key].bones.forEach(e => addTurn(e.slot, e.v, w));
      }
      // Tail: a slow lazy swish at rest, quicker and wider on the move, each segment a little behind.
      const swish = (tailCfg.sway || 0.2) * (0.6 + 0.8 * stride);
      tail.forEach((slot, i) => {
        const v = [0, 0, 0];
        v[tailAxis] = swish * Math.sin(st.time * (1.6 + 2.4 * stride) - i * 0.7);
        addTurn(slot, v, 1);
      });
      const e = new THREE.Euler();
      touched.forEach(t => {
        const q = new THREE.Quaternion().setFromEuler(e.set(t.sum[0], t.sum[1], t.sum[2]));
        t.undo.copy(q).invert();
        t.bone.quaternion.multiply(q);
      });

      const walkBob = !mixer || legsWalk;
      const gait = walkBob ? Math.abs(Math.sin(bob)) * 0.04 * k : 0;
      const s = st.squash;
      holder.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      // Without a sit clip or sit pose, sitting just tilts the whole model back.
      const sitLift = actions.sit || sitPose ? 0 : st.sitT;
      const poseLift = sitPose ? poses.sit.lift * st.sitT : 0;
      holder.rotation.x = -0.35 * sitLift + (mixer ? 0 : (st.air ? -0.25 * Math.sign(st.vy) : Math.sin(bob * 2) * 0.04 * k)) + (legsWalk ? -0.12 * airPose * Math.sign(st.vy) : 0);
      holder.position.set(0, gait - 0.05 * sitLift + poseLift, -0.08 * sitLift);
      holder.rotation.z = mixer ? 0 : Math.sin(bob) * 0.05 * k;
    }
  };
}
