// Settings for the cat model in public/models/cat.glb.
// Current model: "Bicolor Cat" by kenchoo, CC BY 4.0 (see CREDITS.md).
export const MODEL = {
  url: 'models/cat.glb',
  // Turn the model if it faces the wrong way (the game expects it to face +z).
  yawDegrees: 0,
  // Multiplies the nose-to-tail size the game fits the model to.
  scale: 1,
  // Exact bone the hats sit on. Leave empty to use the first bone with "head" in its name.
  headBone: 'Wolf_Neck_TopSHJnt_14',
  // Where the hat sits from that bone, in game units: [sideways, up, forward].
  hatOffset: [0, 0.05, 0.17],
  // Hat size compared with the placeholder cat's hats.
  hatScale: 0.7,
  // Exact clip names, when the loose name matching picks the wrong one.
  // This model has a single idle clip called "Animation" and no walk or run.
  clips: { idle: 'Animation' },
  // The coat the model's own texture already shows. Picking it leaves the texture untinted.
  nativeCoat: 'ginger',
  // Recolours the texture's fur for the other coats: hues between hueMin and hueMax degrees
  // become the coat colour, scaled by how bright they are against furLuminance (linear, 0 to 1).
  // Remove this to fall back to a simple tint over the whole model.
  coatSwap: { hueMin: 6, hueMax: 46, furLuminance: 0.15 },
  // Procedural walk for models without a walk clip: these bones swing about `axis`.
  // Leave `legs` empty to let the loader look for bones named like "l_FrontLeg_Hip".
  gait: {
    axis: 'x',
    swing: 0.55,
    legs: {}
  }
};
