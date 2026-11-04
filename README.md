# The Gato Game

A cosy two-player co-op browser game. Two cats share a dream: three puzzle rooms picked from six, each needing both cats. Bring yarn home and spend it on coats and hats.

Home is a little flat the cats walk around, not a menu: step on a coat cushion or a hat mat to try it on, paw to buy it with yarn from the jar, and curl up in the dream basket together to start a dream. Every finished dream hangs a new picture on the wall.

## Play locally

```bash
npm install
npm run dev
```

Open the address Vite prints. Plug in one or two gamepads and press a button on each so the browser can see them.

| | Cat 1 (Marmalade) | Cat 2 (Smoke) | Gamepad |
| --- | --- | --- | --- |
| Move | W A S D | Arrow keys | Left stick or d-pad |
| Jump | Space | Enter | A |
| Sit (hold) | Left Shift | Right Shift | B |
| Paw | E | / | X |
| Meow | Q | . | Y |

Esc or Start pauses, R or Back restarts the room, M toggles the music. One pad plays Smoke; two pads play both cats.

## Rooms

| Room | Co-op puzzle |
| --- | --- |
| Living room | Cushion plates hold the pet gate open; one cat boosts the other onto the cat tree, which paws the pouf down as a step. |
| Kitchen | Two bells far apart must ring within a second of each other. |
| Bedroom | A plate raises the laundry lift; the cat on top flips a switch that pulls out drawer stairs. |
| Moonlit garden | Stepping stones only show while a cat stands in a moonbeam. |
| Attic | The trunk only moves when both cats push from the same side. |
| Sewing room | The cats share one strand of yarn that only stretches so far. Wind it around all three thread spools. |

## Project layout

- `src/main.js`: game states, menus, runs, the frame loop and camera.
- `src/levels/home.js`: the walkable home: coat cushions, hat mats, yarn jar, memory wall and dream basket.
- `src/levels/`: one file per room, plus shared building helpers.
- `src/cats.js` and `src/catModel.js`: the placeholder cats, hats and the GLB cat loader.
- `src/physics.js`: box collisions, ledge assist, riding on the other cat.
- `src/input.js`, `src/audio.js`, `src/save.js`, `src/scene.js`, `src/core.js`: input, sound and music, the save file, renderer and shared state.
- `public/models/cat.glb`: the cat model, "Bicolor Cat" by kenchoo (CC BY 4.0, see `CREDITS.md`). Its settings are in `src/modelConfig.js`. Swap in another GLB to change the cat (see the README there).

## Checks

```bash
npm run lint
npm run build
npm test   # headless play-throughs; needs Playwright: npm i -D playwright && npx playwright install chromium
```

## Deploy

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to `main`. Turn it on once under Settings, then Pages, then Source: GitHub Actions. (Pages needs a public repository on a free GitHub plan.)
