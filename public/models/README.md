# Cat model

The cat is `cat.glb`, "Bicolor Cat" by kenchoo (CC BY 4.0). To use a different cat, replace that file. The game loads it on start and uses it for both cats instead of the placeholder cats.

- Rigged models with clips play them automatically. A rigged model without a walk clip gets its leg bones swung from code (`gait` in `src/modelConfig.js`). Clip names are matched loosely (idle, walk, run, trot, jump, sit). If the wrong clip plays, set exact names in `src/modelConfig.js`.
- A plain, unrigged model also works. It gets bobbing, leaning, squash and stretch and a sitting pose from code.
- If the cat faces the wrong way, change `yawDegrees` in `src/modelConfig.js`.
- Add `?placeholder` to the page URL to see the placeholder cats again.
- Shop coats recolour fur in the hue band set by `coatSwap`. Remove it for a plain tint over the whole model.
- Hats sit on `headBone`, moved by `hatOffset`.
- Credit the model's creator in `CREDITS.md`.
