// Settings for the real cat model. Drop a GLB at public/models/cat.glb and the game uses it
// instead of the placeholder cats. Add ?placeholder to the URL to force the placeholder.
export const MODEL = {
  url: 'models/cat.glb',
  // Turn the model so its nose points along +z (the game's forward). Try 0, 90, 180 or -90.
  yawDegrees: 0,
  // Extra size multiplier on top of the automatic fit (about 0.95 units nose to tail).
  scale: 1,
  // Raise hats when the rig has a head bone.
  hatLift: 0.12,
  // Map game moves to exact clip names if automatic matching picks the wrong ones,
  // for example { idle: 'Idle_01', walk: 'Walk', run: 'Run', jump: 'Jump', sit: 'Sit' }.
  clips: {}
};
