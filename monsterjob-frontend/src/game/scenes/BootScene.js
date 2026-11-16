import Phaser from 'phaser';
import { buildStar, ensureSparkTexture, createDetailPanel, layoutCreatures } from '../creatureRenderer';

// Main Office (Lobby) - shows idle creatures only. Working creatures live in
// their job-category room instead (OfficeRoomScene). Five clickable "doors"
// along the wall let the player enter each category's room. Still fully
// procedural (no image assets) - see README for what's still placeholder.

const CATEGORIES = [
  { key: 'Labor', color: 0x8f7a5a },
  { key: 'Service', color: 0x4d8fe8 },
  { key: 'Creative', color: 0xb06be8 },
  { key: 'Craft', color: 0xe8a33d },
  { key: 'Combat', color: 0xe8643d }
];

// Draws the office background: wood-plank floor, a back wall with a window,
// and a couple of furniture silhouettes (desk, potted plant) for flavor.
// All procedural - no image assets.
function drawOfficeBackground(scene, width, height, tier) {
  const wallHeight = 70;

  scene.add.rectangle(width / 2, wallHeight / 2, width, wallHeight, 0x2b2118);

  const winX = width - 90;
  const winY = wallHeight / 2;
  const windowFrameColor = tier >= 20 ? 0xe8a33d : 0x1a1410;
  const windowFrameWidth = tier >= 20 ? 4 : 3;
  scene.add.rectangle(winX, winY, 60, 40, 0x6b8fa8).setStrokeStyle(windowFrameWidth, windowFrameColor);
  scene.add.rectangle(winX, winY, 60, 3, windowFrameColor);
  scene.add.rectangle(winX, winY, 3, 40, windowFrameColor);

  const plankHeight = 22;
  const floorTop = wallHeight;
  const plankColors = [0x3d2f22, 0x453527];
  for (let y = floorTop; y < height; y += plankHeight) {
    const shade = plankColors[Math.floor((y - floorTop) / plankHeight) % 2];
    const bandHeight = Math.min(plankHeight, height - y);
    scene.add
      .rectangle(width / 2, y + bandHeight / 2, width, bandHeight, shade)
      .setStrokeStyle(1, 0x2b2118, 0.3);
  }

  if (tier >= 5) {
    scene.add
      .rectangle(width / 2, height - 55, 140, 50, 0x8a4a3a, 0.7)
      .setStrokeStyle(2, 0x6b2f22);
  }

  const deskX = 45;
  const deskY = height - 30;
  scene.add.rectangle(deskX, deskY, 70, 14, 0x5a4530).setStrokeStyle(2, 0x2b2118);
  scene.add.rectangle(deskX - 30, deskY + 14, 6, 16, 0x2b2118);
  scene.add.rectangle(deskX + 30, deskY + 14, 6, 16, 0x2b2118);

  if (tier >= 10) {
    const desk2X = width / 2 + 20;
    const desk2Y = wallHeight + 20;
    scene.add.rectangle(desk2X, desk2Y, 60, 12, 0x5a4530).setStrokeStyle(2, 0x2b2118);
    scene.add.rectangle(desk2X - 25, desk2Y + 12, 5, 14, 0x2b2118);
    scene.add.rectangle(desk2X + 25, desk2Y + 12, 5, 14, 0x2b2118);
  }

  const plantX = width - 30;
  const plantY = height - 24;
  scene.add.triangle(plantX, plantY - 18, 0, 20, 20, 20, 10, -10, 0x6b8f5a);
  scene.add.triangle(plantX, plantY - 8, 0, 20, 20, 20, 10, -10, 0x5a7a4a);
  scene.add.rectangle(plantX + 10, plantY + 10, 16, 12, 0x8a5a3a).setStrokeStyle(2, 0x2b2118);

  if (tier >= 15) {
    const trophyX = 40;
    const trophyY = wallHeight / 2;
    const star = buildStar(5, 12, 5);
    const trophyGfx = scene.add.graphics({ x: trophyX, y: trophyY });
    trophyGfx.fillStyle(0xe8a33d, 1);
    trophyGfx.lineStyle(1, 0x8a5a1a, 1);
    trophyGfx.beginPath();
    trophyGfx.moveTo(star[0][0], star[0][1]);
    for (let i = 1; i < star.length; i++) {
      trophyGfx.lineTo(star[i][0], star[i][1]);
    }
    trophyGfx.closePath();
    trophyGfx.fillPath();
    trophyGfx.strokePath();
  }

  scene.add
    .text(width / 2, 8, 'MonsterJob Office', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e8a33d'
    })
    .setOrigin(0.5, 0);

  scene.add
    .text(width / 2, 26, `Tier ${tier}`, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: tier >= 20 ? '#e8a33d' : '#f4ecd8',
      alpha: 0.8
    })
    .setOrigin(0.5, 0);
}

// Small row of star icons on the wall - filled gold for each unlocked
// achievement, dim outline for the rest. Purely a passive visual indicator;
// clicking it shows a one-line summary via the shared detail panel, but the
// actual Achievements list still lives in the React sidebar.
function drawTrophyShelf(scene, width, unlocked, total, showDetail) {
  if (total === 0) return;

  const iconSpacing = 20;
  const startX = width / 2 - ((total - 1) * iconSpacing) / 2;
  const y = 48;

  for (let i = 0; i < total; i++) {
    const isUnlocked = i < unlocked;
    const star = buildStar(5, 7, 3);
    const gfx = scene.add.graphics({ x: startX + i * iconSpacing, y });
    gfx.fillStyle(isUnlocked ? 0xe8a33d : 0x2b2118, 1);
    gfx.lineStyle(1, isUnlocked ? 0x8a5a1a : 0x6b5138, 1);
    gfx.beginPath();
    gfx.moveTo(star[0][0], star[0][1]);
    for (let p = 1; p < star.length; p++) {
      gfx.lineTo(star[p][0], star[p][1]);
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
    gfx.setInteractive(new Phaser.Geom.Circle(0, 0, 8), Phaser.Geom.Circle.Contains);
    gfx.on('pointerdown', () => showDetail(`Achievements: ${unlocked}/${total} unlocked\nCheck the Achievements panel for details`));
  }
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    const officeTier = this.registry.get('officeTier') || 1;
    const idleCreatures = this.registry.get('officeIdle') || [];
    const byCategory = this.registry.get('officeByCategory') || {};

    drawOfficeBackground(this, width, height, officeTier);

    ensureSparkTexture(this);
    const { showDetail } = createDetailPanel(this, width, height);

    const unlockedAchievementCount = this.registry.get('unlockedAchievementCount') || 0;
    const totalAchievementCount = this.registry.get('totalAchievementCount') || 0;
    drawTrophyShelf(this, width, unlockedAchievementCount, totalAchievementCount, showDetail);

    // Five doors along the top of the floor, one per job category, each
    // showing how many creatures are currently working there. Clicking one
    // enters that category's room (OfficeRoomScene).
    const doorY = 90;
    const doorSpacing = width / (CATEGORIES.length + 1);
    CATEGORIES.forEach((cat, i) => {
      const doorX = doorSpacing * (i + 1);
      const count = (byCategory[cat.key] || []).length;

      const door = this.add
        .rectangle(doorX, doorY, 52, 34, cat.color, 0.85)
        .setStrokeStyle(2, 0x1a1410)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(doorX, doorY - 3, cat.key, {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: '#1a1410',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      this.add
        .text(doorX, doorY + 10, `${count} working`, {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#1a1410'
        })
        .setOrigin(0.5);

      door.on('pointerover', () => door.setAlpha(1));
      door.on('pointerout', () => door.setAlpha(0.85));
      door.on('pointerdown', () => {
        this.scene.start('OfficeRoomScene', { category: cat.key });
      });
    });

    if (idleCreatures.length === 0) {
      this.add
        .text(width / 2, height / 2 + 20, 'No idle creatures -\ncatch one, or check the\ndoors above for working ones', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#f4ecd8',
          align: 'center'
        })
        .setOrigin(0.5);
      return;
    }

    layoutCreatures(this, idleCreatures, width, height, showDetail, { rowY: height - 90 });
  }
}
