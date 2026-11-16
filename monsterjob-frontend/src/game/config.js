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
export const createGameConfig = (parentElementId) => ({
  type: Phaser.AUTO,
  width: 480,
  height: 320,
  parent: parentElementId,
  backgroundColor: '#2b2118',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, BootScene, OfficeRoomScene]
});
