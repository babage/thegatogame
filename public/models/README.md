# Cat model

Put the cat GLB here as `cat.glb`. The game loads it on start and uses it for both cats instead of the placeholder cats.

- Rigged models with clips play them automatically. Clip names are matched loosely (idle, walk, run, trot, jump, sit). If the wrong clip plays, set exact names in `src/modelConfig.js`.
- A plain, unrigged model also works. It gets bobbing, leaning, squash and stretch and a sitting pose from code.
- If the cat faces the wrong way, change `yawDegrees` in `src/modelConfig.js`.
- Add `?placeholder` to the page URL to see the placeholder cats again.
- Credit the model's creator in `CREDITS.md`.
