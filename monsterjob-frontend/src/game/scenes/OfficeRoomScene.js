import Phaser from 'phaser';
import { ensureSparkTexture, createDetailPanel, layoutCreatures, layoutJobStations } from '../creatureRenderer';

// One reusable scene for all 5 job-category rooms (Labor, Service, Creative,
// Craft, Combat) - which category to show is passed in via init(data) when
// the scene starts, e.g. this.scene.start('OfficeRoomScene', { category: 'Labor' }).
// Shows only creatures currently working a job in that category (from the
// registry's officeByCategory, kept up to date by PhaserGame.jsx).

const CATEGORY_THEME = {
  Labor: { wall: 0x3a2f1f, floor: [0x4a3a26, 0x52422c], accent: 0x8f7a5a, label: 'Labor Yard' },
  Service: { wall: 0x1f2a3a, floor: [0x263349, 0x2c3b52], accent: 0x4d8fe8, label: 'Service Floor' },
  Creative: { wall: 0x2f1f3a, floor: [0x3a2649, 0x422c52], accent: 0xb06be8, label: 'Creative Studio' },
  Craft: { wall: 0x3a2f1a, floor: [0x4a3a20, 0x524228], accent: 0xe8a33d, label: 'Craft Workshop' },
  Combat: { wall: 0x3a1f1f, floor: [0x492626, 0x522c2c], accent: 0xe8643d, label: 'Combat Arena' }
};

export default class OfficeRoomScene extends Phaser.Scene {
  constructor() {
    super('OfficeRoomScene');
  }

  init(data) {
    this.category = data?.category || 'Labor';
  }

  create() {
    const { width, height } = this.cameras.main;
    const theme = CATEGORY_THEME[this.category] || CATEGORY_THEME.Labor;
    const creatures = (this.registry.get('officeByCategory') || {})[this.category] || [];
    const jobs = (this.registry.get('officeJobsByCategory') || {})[this.category] || [];

    this.drawRoomBackground(width, height, theme);

    ensureSparkTexture(this);
    const { showDetail } = createDetailPanel(this, width, height);

    layoutJobStations(this, jobs, width, 55, showDetail, theme.accent);

    // Back button to return to the Main Office
    const backButton = this.add
      .rectangle(40, 20, 60, 22, 0x1a1410, 0.85)
      .setStrokeStyle(2, theme.accent)
      .setInteractive({ useHandCursor: true });
    const backLabel = this.add
      .text(40, 20, '< Office', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#f4ecd8'
      })
      .setOrigin(0.5);
    backButton.on('pointerover', () => backButton.setAlpha(1));
    backButton.on('pointerout', () => backButton.setAlpha(0.85));
    backButton.on('pointerdown', () => this.scene.start('BootScene'));
    backLabel.setDepth(1);

    if (creatures.length === 0) {
      this.add
        .text(width / 2, height / 2 + 20, `No creatures working in\n${theme.label} right now`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#f4ecd8',
          align: 'center'
        })
        .setOrigin(0.5);
      return;
    }

    layoutCreatures(this, creatures, width, height, showDetail, { rowY: height - 60 });
  }

  drawRoomBackground(width, height, theme) {
    const wallHeight = 55;

    this.add.rectangle(width / 2, wallHeight / 2, width, wallHeight, theme.wall);

    this.add
      .text(width / 2, 8, theme.label, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e8a33d'
      })
      .setOrigin(0.5, 0);

    const plankHeight = 22;
    const floorTop = wallHeight;
    for (let y = floorTop; y < height; y += plankHeight) {
      const shade = theme.floor[Math.floor((y - floorTop) / plankHeight) % 2];
      const bandHeight = Math.min(plankHeight, height - y);
      this.add
        .rectangle(width / 2, y + bandHeight / 2, width, bandHeight, shade)
        .setStrokeStyle(1, theme.wall, 0.3);
    }
  }
}
