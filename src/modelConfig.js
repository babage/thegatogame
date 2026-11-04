// Settings for the cat model in public/models/cat.glb.
// Current model: "Bicolor Cat" by kenchoo, CC BY 4.0 (see CREDITS.md).
export const MODEL = {
  // VITE_CAT_URL at build time overrides this, for hosts that need another file name.
  url: import.meta.env.VITE_CAT_URL || 'models/cat.glb',
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
  },
  // Poses blended in from code, as [x, y, z] turns in radians on each bone's own axes.
  // On this rig, legs swing forward on +x, the root tips nose-down on +z, the neck and head
  // tip nose-down on +x, and the tail sways on x and lifts on +z. `lift` lowers the body, in the model's own units.
  poses: {
    sit: {
      lift: -0.125,
      bones: {
        Wolf_ROOTSHJnt_38: [0, 0, -0.45],
        Wolf_Neck_01SHJnt_16: [0.35, 0, 0],
        Wolf_l_FrontLeg_HipSHJnt_4: [-0.45, 0, 0],
        Wolf_r_FrontLeg_HipSHJnt_10: [-0.45, 0, 0],
        Wolf_l_HindLeg_HipSHJnt_27: [1.2, 0, 0],
        Wolf_r_HindLeg_HipSHJnt_33: [1.2, 0, 0],
        Wolf_l_HindLeg_Knee1SHJnt_26: [-1.5, 0, 0],
        Wolf_r_HindLeg_Knee1SHJnt_32: [-1.5, 0, 0],
        Wolf_l_HindLeg_Knee2SHJnt_25: [0.7, 0, 0],
        Wolf_r_HindLeg_Knee2SHJnt_31: [0.7, 0, 0],
        Wolf_Tail_01_02SHJnt_37: [0.5, 0, 0.5],
        Wolf_Tail_01_03SHJnt_36: [0.5, 0, 0.4]
      }
    },
    // A batting swipe with the right front paw.
    paw: {
      bones: {
        Wolf_ROOTSHJnt_38: [0, 0, -0.12],
        Wolf_r_FrontLeg_HipSHJnt_10: [2.2, 0, 0],
        Wolf_r_FrontLeg_KneeSHJnt_9: [-0.2, 0, 0],
        Wolf_Head_JawSHJnt_12: [0.2, 0, 0]
      }
    },
    // This rig has no working jaw, so a meow lifts the head instead.
    meow: {
      bones: {
        Wolf_Neck_01SHJnt_16: [-0.3, 0, 0],
        Wolf_Head_JawSHJnt_12: [-0.35, 0, 0]
      }
    }
  },
  // Tail bones from base to tip, swishing about `axis` by up to `sway` radians each.
  tail: {
    axis: 'x',
    sway: 0.22,
    bones: ['Wolf_Tail_01_02SHJnt_37', 'Wolf_Tail_01_03SHJnt_36', 'Wolf_Tail_01_04SHJnt_35', 'Wolf_Tail_01_05SHJnt_34']
  }
};
