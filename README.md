# The Gato Game

A cosy two-player co-op browser game. Two cats share a dream: three puzzle rooms picked from five, each needing both cats. Bring yarn home and spend it on coats and hats.

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

## Project layout

- `src/main.js`: game states, menus, the home shop, runs, the frame loop and camera.
- `src/levels/`: one file per room, plus shared building helpers.
- `src/cats.js` and `src/catModel.js`: the placeholder cats, hats and the GLB cat loader.
- `src/physics.js`: box collisions, ledge assist, riding on the other cat.
- `src/input.js`, `src/audio.js`, `src/save.js`, `src/scene.js`, `src/core.js`: input, sound and music, the save file, renderer and shared state.
- `public/models/`: drop a `cat.glb` here to replace the placeholder cats (see the README there).

## Checks

```bash
npm run lint
npm run build
npm test   # headless play-throughs; needs Playwright: npm i -D playwright && npx playwright install chromium
```

## Deploy

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to `main`. Turn it on once under Settings, then Pages, then Source: GitHub Actions. (Pages needs a public repository on a free GitHub plan.)
