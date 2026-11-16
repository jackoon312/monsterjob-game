import manifest from './creatureSpriteManifest.json';

// Loads and plays the code-drawn creature sprite sheets produced by
// art-src/build.js. creatureSpriteManifest.json (also written by that
// script) lists which sheets exist; any species not in it - or whose sheet
// failed to load - simply gets no sprite, and creatureRenderer.js falls back
// to the old procedural polygon. That keeps the game fully playable while
// the art is rolled out one species at a time.
//
// Sheets are keyed by the species' spriteAssetPath (the value seeded into
// MongoDB by monsterjob-backend/seed/seedSpecies.js), served from public/.

const textureKey = (assetPath) => `creature:${assetPath}`;
const animKey = (assetPath, name) => `${textureKey(assetPath)}:${name}`;

// Textures live on the Phaser.Game, not the scene, and PhaserGame.jsx
// restarts scenes on every data change - so queue the downloads only once
// per game instance instead of on every restart.
const gamesAlreadyLoading = new WeakSet();

// Call from a scene's preload(). Safe to call from every scene.
export function preloadCreatureSprites(scene) {
  if (gamesAlreadyLoading.has(scene.game)) return;
  gamesAlreadyLoading.add(scene.game);

  manifest.sheets.forEach((assetPath) => {
    const key = textureKey(assetPath);
    if (scene.textures.exists(key)) return;
    const url = import.meta.env.BASE_URL + assetPath.replace(/^\//, '');
    scene.load.spritesheet(key, url, {
      frameWidth: manifest.frameWidth,
      frameHeight: manifest.frameHeight
    });
  });
}

// Returns an animated sprite at local (0,0) for this species, or null if
// there is no usable sheet for it (caller should draw the fallback shape).
export function createCreatureSprite(scene, species, isWorking) {
  const assetPath = species?.spriteAssetPath;
  if (!assetPath || !manifest.sheets.includes(assetPath)) return null;

  const key = textureKey(assetPath);
  if (!scene.textures.exists(key)) return null;

  // Animations are global to the game too - register each one once.
  manifest.animations.forEach(({ name, row, fps }) => {
    const anim = animKey(assetPath, name);
    if (scene.anims.exists(anim)) return;
    scene.anims.create({
      key: anim,
      frames: scene.anims.generateFrameNumbers(key, {
        start: row * manifest.columns,
        end: row * manifest.columns + manifest.columns - 1
      }),
      frameRate: fps,
      repeat: -1
    });
  });

  const sprite = scene.add.sprite(0, 0, key);
  sprite.play(animKey(assetPath, isWorking ? 'work' : 'idle'));
  return sprite;
}
