# MonsterJob art plan

Phase 0 is done (Flamicore only); Phases 1–4 are still plan. Follows the rules in `CLAUDE.md`: original, code-drawn, cute/chibi top-down pixel art; generators in `art-src/`; output in `monsterjob-frontend/public/assets/`; paths match `spriteAssetPath` in `seed/seedSpecies.js`.

## 1. What is a procedural placeholder today

There are no image files anywhere: `monsterjob-frontend/public/` does not exist, no scene has a `preload()`, and the frontend never reads `spriteAssetPath`. Everything on the 480×320 canvas is Phaser `Graphics`/`rectangle`/`text`.

| Visual | Where | Currently |
|---|---|---|
| Creatures (24 species) | `creatureRenderer.js` | One flat polygon per **type** (8 shapes), so species of the same type look identical; rarity is only a border colour/width |
| Creature animation | `renderCreature` | Tweens only: bob, click pop, Legendary pulse |
| Working state | `renderCreature` | 65% alpha plus a spinning octagon badge |
| Equipped gear | `renderCreature` | Three coloured dots (head/body/accessory) |
| Rare+ particles | `ensureSparkTexture` | 8×8 white circle |
| Main Office | `BootScene.js` | Striped rectangles for floor and wall; window, desks, plant, rug, trophy star as shapes, some gated by tier 5/10/15/20 |
| Category doors (5) | `BootScene.js` | Coloured rectangles with text |
| Trophy shelf | `BootScene.js` | Small star polygons |
| Category rooms (5) | `OfficeRoomScene.js` | Same stripes, recoloured per category; no furniture |
| Job stations (53 jobs) | `layoutJobStations` | Rectangle plus a 💼 emoji |
| Title screen | `MenuScene.js` | Text, three faint shapes, rectangle button |
| Detail panel, buttons, labels | all scenes | Rectangles and 7–14px `monospace` text |

Outside the canvas, the React panels use emoji (💰 🏆 🔒) as icons. The equipment and job seeds have no `icon` value at all, although both models have the field.

## 2. Phased plan

**Phase 0 — Pipeline, Flamicore only. Done.** `node art-src/build.js` (no dependencies) reads each module in `art-src/creatures/`, validates it against the spec below, and writes the sheet to the path seeded in `seedSpecies.js`, a 4x contact sheet to `art-src/contact/`, and a manifest the game loads from. `art-src/preview.html` opens by double-click and plays the sheets at 1x and 4x with no server. In the game, a species with a sheet in the manifest is drawn as an animated sprite (idle row when idle, work row when on a job); every other species, and any sheet that fails to load, still gets the old polygon.

**Phase 1 — Creatures (24 sheets).** One file per species at the seeded path, e.g. `/assets/creatures/flamicore.png`. Work Common → Legendary so the most-seen creatures land first. Replace the rarity border with a rarity-coloured ground ring so that information is not lost; keep the particles.

**Phase 2 — Rooms.** Main Office floor, wall, window, desk, plant and the tier 5/10/15/20 additions; then the five category rooms with one or two signature props each (anvil, counter, easel, workbench, training dummy). Doors become real door sprites with a category sign.

**Phase 3 — Props and UI.** Job-station icons (one per category to start — 5, not 53), the working badge, three gear-slot icons, trophy stars, spark particle, panel and button frames, title logo.

**Phase 4 — React side (optional).** Coin, trophy and lock icons to replace emoji; equipment icons for the 15 shop items, which also means filling the empty `icon` seed field.

Each phase ends with `npm run build`, a manual pass over jobs/equipment/office/achievements, and a commit.

## 3. Recommended sprite spec

**Frames**
- Creature frame: **32×32**, transparent background, feet on a shared baseline 2px from the bottom, centred. This matches the current ~40px footprint and 70px grid spacing, so layout does not move.
- Creature sheet: **192×64**, 6 columns × 2 rows. Row 0 = idle (6 frames, 6 fps, loop). Row 1 = work (6 frames, 8 fps, loop). Six columns matches the `animationFrames: 6` already seeded for every species.
- Tiles and props on a **16×16** grid (props may span several cells). Icons 16×16. Backgrounds composed to 480×320.
- No rotation or sub-pixel offsets inside frames; motion is redrawn pixels, 1–2px squash and bounce.

**Palette**
- One master palette of at most 32 colours, built outward from the colours already in the game (`#2b2118`, `#3d2f22`, `#f4ecd8`, `#e8a33d`, and the eight type colours).
- At most **10 colours per creature including the outline; 12 for Rare and above**. `build.js` fails the build if a sheet goes over. Each type gets a 3-step ramp (shadow, base, highlight) with hue shifted, not just darkened.
- Outline is the warm dark `#1a1410`, never pure black. Light comes from the top-left. Alpha is 0 or 255 only — no anti-aliasing, gradients or soft shadows.
- Rarity shows through added detail and one accent colour, not through size.

**Cute style (applies to every creature)**
- Big head: about 40–50% of the sprite height, ears or crest included.
- Large eyes (about 3×4px) with one white highlight pixel in the upper-left.
- Small rounded body, short stubby limbs, soft rounded silhouette — no long necks, thin legs or sharp spikes.
- Friendly expression: small smile, blush on the cheeks; closed-happy eyes are allowed in the work row.
- Clear dark outline around every part; 2–3 tones per colour, no more.
- Silhouette test: filled in one flat colour at 1x, the creature must still be recognisable by its one signature feature (Flamicore: fox ears plus flame tail).

**Generator rules**
- Deterministic: same script, same bytes (no `Math.random` without a fixed seed), so diffs are reviewable.
- Each species is a set of named parts drawn as text grids (head, body, tail, eye states); frames are built by stamping parts at whole-pixel offsets, and the 1px outline is added automatically. This keeps 288 frames manageable.
- `build.js` rejects a sheet that is not 12 frames, spills outside the frame or below the baseline, or breaks the colour limit.

## 4. Risks

- **Originality.** Names like Phoenixreborn or Infernodrake pull toward familiar monster designs. Each batch needs a contact sheet you review for resemblance before it is wired in.
- **Quality ceiling of code-drawn art.** Hand-placed pixel grids are slow and can look stiff. Flamicore took four drafts; expect the same per species.
- **Sprites look small in the game.** A 32px sprite at 1x is visibly smaller than the ~40px polygons beside it, and the page layout currently shows the 480×320 canvas at well under its native size.
- **Paths are stored in the database.** `spriteAssetPath` is copied into MongoDB by the seed script, so any rename needs a reseed of every environment, including a deployed one.
- **Scene restarts.** `PhaserGame.jsx` restarts the active scene on every data change. Textures and animations must be loaded and registered once, guarded against duplicate keys, or this will flicker or throw.
- **Uneven pixels.** The canvas uses `Scale.FIT`, which scales by non-integer factors; real pixel art will show this far more than flat shapes do. The 7–9px `monospace` labels will also clash with the sprites. Both need a later code decision.
- **Lost information.** Type shape, rarity border, gear dots and the dimmed working state all carry gameplay meaning today; each needs an explicit replacement.
- **Build output folder.** Vite writes bundled JS/CSS to `dist/assets/`, the same folder `public/assets/` is copied into. Keeping art in subfolders (`creatures/`, `rooms/`, `ui/`) avoids name clashes.
- **Verification.** There are no tests, and the game needs a live MongoDB to show creatures, so in-game checks are manual. A standalone preview page in `art-src/` covers the art itself.
- **Stale snapshots.** The two root `.zip` files will drift further from the source as art lands.
