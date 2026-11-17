import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import BootScene from './scenes/BootScene';
import OfficeRoomScene from './scenes/OfficeRoomScene';

// Central Phaser config. MenuScene is the entry point (title screen with a
// Start button); BootScene is the Main Office (idle creatures + 5 doors,
// one per job category); OfficeRoomScene is a single reusable scene for all
// 5 category rooms (which one to show is passed via scene.start data).
// Real scenes still missing from the design doc's 8: JobScene,
// CreatureDetailScene, EquipmentScene, AchievementsScene (those currently
// live in React sidebars instead).
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 320;
const MAX_ZOOM = 4;

// Pixel art only stays crisp when every game pixel covers a whole number of
// screen pixels, so the canvas is never stretched to fit: it is shown at
// 1x, 2x, 3x... - the largest whole multiple that fits the space available.
export const wholeNumberZoom = (availableWidth, availableHeight) => {
  const fit = Math.floor(Math.min(availableWidth / GAME_WIDTH, availableHeight / GAME_HEIGHT));
  return Math.max(1, Math.min(MAX_ZOOM, fit || 1));
};

export const createGameConfig = (parentElementId) => ({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: parentElementId,
  backgroundColor: '#2b2118',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    zoom: 1
  },
  scene: [MenuScene, BootScene, OfficeRoomScene]
});
