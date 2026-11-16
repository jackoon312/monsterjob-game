import Phaser from 'phaser';

// Second real scene from the design doc's 8-scene list (Boot/Menu/Game/
// Office/Job/CreatureDetail/Equipment/Achievements). Simple title screen
// with a Start button that hands off into BootScene (currently doing double
// duty as the office view). Fully procedural - no image assets, matching
// the rest of the scenes so far.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x2b2118);

    // A few soft floating background shapes for atmosphere, echoing the
    // creature silhouettes used everywhere else in the game
    this.add.circle(60, 80, 14, 0x4d8fe8, 0.25);
    this.add.triangle(width - 70, 60, 0, 24, 20, 24, 10, -12, 0xe8643d, 0.25);
    this.add.circle(width - 50, height - 70, 10, 0xb06be8, 0.25);

    this.add
      .text(width / 2, height / 2 - 50, 'MonsterJob', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#e8a33d'
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 12, 'clock in your creatures', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#f4ecd8'
      })
      .setOrigin(0.5)
      .setAlpha(0.75);

    const startButton = this.add
      .rectangle(width / 2, height / 2 + 50, 140, 40, 0xe8a33d)
      .setStrokeStyle(2, 0x8a5a1a)
      .setInteractive({ useHandCursor: true });

    const startLabel = this.add
      .text(width / 2, height / 2 + 50, 'Start', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#2b2118'
      })
      .setOrigin(0.5);

    startButton.on('pointerover', () => startButton.setFillStyle(0xc8842a));
    startButton.on('pointerout', () => startButton.setFillStyle(0xe8a33d));
    startButton.on('pointerdown', () => {
      this.scene.start('BootScene');
    });

    // Gentle pulse on the button so it reads as clickable even before hover
    this.tweens.add({
      targets: [startButton, startLabel],
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
