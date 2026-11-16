// Shared rendering logic used by both the Main Office (BootScene, idle
// creatures) and each job-category room (OfficeRoomScene, working
// creatures) - kept in one place so both scenes stay visually consistent
// and don't duplicate ~150 lines of shape/animation code.

import { createCreatureSprite } from './creatureSprites';

export const TYPE_COLORS = {
  Fire: 0xe8643d,
  Water: 0x4d8fe8,
  Nature: 0x6b8f5a,
  Electric: 0xe8d33d,
  Rock: 0x8f7a5a,
  Metal: 0xa0a0a8,
  Psychic: 0xb06be8,
  Dark: 0x4a3a5a
};

export const RARITY_BORDER = {
  Common: { color: 0x8a8a8a, width: 2, pulse: false, particles: false },
  Uncommon: { color: 0x6b8f5a, width: 2, pulse: false, particles: false },
  Rare: { color: 0x4d8fe8, width: 3, pulse: false, particles: true },
  Epic: { color: 0xb06be8, width: 3, pulse: false, particles: true },
  Legendary: { color: 0xe8a33d, width: 4, pulse: true, particles: true }
};

export function buildStar(points, outerRadius, innerRadius) {
  const step = Math.PI / points;
  const result = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    result.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return result;
}

// Each shape is a set of points around origin (0,0), radius roughly 18-20px.
// Silhouettes are deliberately simple/geometric but distinct per type, so
// you can tell creature types apart at a glance even without art.
const SHAPES = {
  Fire: [
    [0, -20],
    [17, 14],
    [-17, 14]
  ], // flame/triangle
  Water: null, // drawn as a circle, handled separately
  Nature: [
    [0, -20],
    [20, 0],
    [0, 20],
    [-20, 0]
  ], // diamond/leaf
  Electric: [
    [-6, -20],
    [8, -4],
    [-2, -4],
    [10, 20],
    [-8, 2],
    [2, 2]
  ], // lightning bolt
  Rock: [
    [10, -18],
    [18, 0],
    [10, 18],
    [-10, 18],
    [-18, 0],
    [-10, -18]
  ], // hexagon
  Metal: [
    [7, -18],
    [18, -7],
    [18, 7],
    [7, 18],
    [-7, 18],
    [-18, 7],
    [-18, -7],
    [-7, -18]
  ], // octagon
  Psychic: buildStar(5, 20, 8), // 5-point star
  Dark: [
    [0, -20],
    [10, -6],
    [20, 4],
    [6, 10],
    [0, 20],
    [-8, 8],
    [-20, 2],
    [-8, -8]
  ] // jagged void shard
};

// Draws one creature's shape at local (0,0), colored by type, bordered by
// rarity. Meant to be added to a Container by the caller, not positioned
// directly - this is what lets the shape, its equipment dots, and its
// working badge all bob together as one unit instead of the dots/badge
// staying visually still while only the shape moves.
function drawCreatureShape(scene, type, rarity) {
  const color = TYPE_COLORS[type] || 0xe8a33d;
  const border = RARITY_BORDER[rarity] || RARITY_BORDER.Common;

  const gfx = scene.add.graphics();
  gfx.fillStyle(color, 1);
  gfx.lineStyle(border.width, border.color, 1);

  const points = SHAPES[type];

  if (type === 'Water' || !points) {
    gfx.fillCircle(0, 0, 18);
    gfx.strokeCircle(0, 0, 18);
  } else {
    gfx.beginPath();
    gfx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      gfx.lineTo(points[i][0], points[i][1]);
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
  }

  return { gfx, border };
}

// Generates a tiny soft circle texture once per scene, used by particle
// emitters for higher-rarity creatures. Cheap (single small texture, reused
// by every emitter), not regenerated per-creature. Safe to call multiple
// times - Phaser's texture manager is checked first.
export function ensureSparkTexture(scene) {
  if (scene.textures.exists('spark')) return;
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });
  gfx.fillStyle(0xffffff, 1);
  gfx.fillCircle(4, 4, 4);
  gfx.generateTexture('spark', 8, 8);
  gfx.destroy();
}

// Creates the shared bottom detail panel (hidden until first click) and
// returns { showDetail, hideDetail } for the scene to wire up per creature.
export function createDetailPanel(scene, width, height) {
  const panelHeight = 58;
  const panelY = height - 34;

  const detailBg = scene.add
    .rectangle(width / 2, panelY, width - 16, panelHeight, 0x1a1410, 0.92)
    .setStrokeStyle(2, 0xe8a33d)
    .setDepth(1000)
    .setVisible(false);
  const detailText = scene.add
    .text(20, panelY, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#f4ecd8',
      lineSpacing: 4
    })
    .setOrigin(0, 0.5)
    .setDepth(1001)
    .setVisible(false);
  const detailClose = scene.add
    .text(width - 20, panelY - panelHeight / 2 + 8, '[x]', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e8a33d'
    })
    .setOrigin(1, 0.5)
    .setDepth(1001)
    .setVisible(false)
    .setInteractive({ useHandCursor: true });

  const hideDetail = () => {
    detailBg.setVisible(false);
    detailText.setVisible(false);
    detailClose.setVisible(false);
  };
  detailClose.on('pointerdown', hideDetail);

  const showDetail = (text) => {
    detailText.setText(text);
    detailBg.setVisible(true);
    detailText.setVisible(true);
    detailClose.setVisible(true);
  };

  return { showDetail, hideDetail };
}

// Builds the same summary text createDetailPanel used to build internally -
// kept as its own function so both renderCreature and any future caller can
// reuse it without duplicating the formatting.
const STAT_KEYS = ['strength', 'intelligence', 'stamina', 'charisma', 'speed', 'health'];
const STAT_ABBR = { strength: 'STR', intelligence: 'INT', stamina: 'STA', charisma: 'CHA', speed: 'SPD', health: 'HP' };

// Mirrors the backend's utils/effectiveStats.js exactly: base stat *
// (1 + sum of equipped items' bonus% for that stat / 100), rounded. Kept in
// sync manually since this is a display-only client-side calculation - the
// backend's version is still the source of truth for anything that affects
// actual gameplay (job eligibility, etc.).
function calculateEffectiveStats(creature) {
  const equippedItems = [
    creature.equipment?.head,
    creature.equipment?.body,
    creature.equipment?.accessory
  ].filter((item) => item && typeof item === 'object' && item.statBonus);

  const bonusPercent = {};
  STAT_KEYS.forEach((key) => {
    bonusPercent[key] = 0;
  });
  equippedItems.forEach((item) => {
    STAT_KEYS.forEach((key) => {
      bonusPercent[key] += item.statBonus[key] || 0;
    });
  });

  const effective = {};
  STAT_KEYS.forEach((key) => {
    const base = creature.stats?.[key] || 0;
    effective[key] = Math.round(base * (1 + bonusPercent[key] / 100));
  });
  return effective;
}

function creatureSummaryText(creature) {
  const species = creature.creatureSpeciesId;
  const statusLine = creature.currentJob ? 'Status: Working' : 'Status: Idle';
  const gearCount = ['head', 'body', 'accessory'].filter((k) => creature.equipment?.[k]).length;
  const hasBonus = gearCount > 0;

  const effective = calculateEffectiveStats(creature);
  const statsLine = STAT_KEYS.filter((k) => k !== 'health')
    .map((k) => `${STAT_ABBR[k]} ${effective[k]}`)
    .join(' ');

  const header = `${creature.nickname || 'Unnamed'} - Lv.${creature.level} ${species?.rarity || ''} ${species?.type || ''}`;
  const statusAndGear = `${statusLine} - ${gearCount}/3 gear slots equipped`;
  const statsHeader = hasBonus ? 'Stats (incl. gear bonus):' : 'Stats:';

  return `${header}\n${statusAndGear}\n${statsHeader} ${statsLine} HP ${effective.health}`;
}

// Builds a one-line summary for a job station popup.
export function jobSummaryText(job) {
  const req = job.requiredStats;
  const statParts = [];
  if (req.minimumStrength) statParts.push(`STR ${req.minimumStrength}+`);
  if (req.minimumIntelligence) statParts.push(`INT ${req.minimumIntelligence}+`);
  if (req.minimumStamina) statParts.push(`STA ${req.minimumStamina}+`);
  if (req.minimumCharisma) statParts.push(`CHA ${req.minimumCharisma}+`);
  if (req.minimumSpeed) statParts.push(`SPD ${req.minimumSpeed}+`);
  const statLine = statParts.length > 0 ? statParts.join(', ') : 'No stat minimums';
  return `${job.name} - ${job.difficulty} - Lv.${req.minimumLevel}+\n💰${job.baseSalary} · ${job.durationMinutes}m · risk ${job.riskFactor}% · ${statLine}\nUse the Assign a Job panel to send a creature here`;
}

// Renders one creature at (x, y): shape + equipment dots + working badge (if
// applicable) grouped in a Container that bobs/pulses together, plus a
// clickable hit area wired to showDetail, plus a nickname label and ambient
// particles for Rare+ rarities. This is the single per-creature draw routine
// shared by the Main Office and every category room.
//
// If the species has a code-drawn sprite sheet (see creatureSprites.js) that
// is used instead of the polygon: the sheet's own idle/work animation
// replaces the bob tween and the dimming, and rarity moves from the shape's
// border to a coloured ring on the ground under the creature's feet.
export function renderCreature(scene, creature, x, y, index, showDetail) {
  const species = creature.creatureSpeciesId;
  const type = species?.type;
  const rarity = species?.rarity;
  const isWorking = !!creature.currentJob;

  const container = scene.add.container(x, y);

  const sprite = createCreatureSprite(scene, species, isWorking);
  let gfx = null;
  let border = RARITY_BORDER[rarity] || RARITY_BORDER.Common;

  if (sprite) {
    // Feet rest 3px above the bottom of the 32px frame, i.e. local y = +13.
    const ring = scene.add.ellipse(0, 13, 26, 8, 0x1a1410, 0.45).setStrokeStyle(1, border.color, 0.9);
    container.add(ring);
    container.add(sprite);
  } else {
    ({ gfx, border } = drawCreatureShape(scene, type, rarity));
    container.add(gfx);
  }

  container
    .setSize(40, 40)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      showDetail(creatureSummaryText(creature));
      scene.tweens.add({
        targets: container,
        scale: 1.2,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    });

  // Small dots around the shape showing which gear slots are filled - head
  // (top-left, gold), body (top-right, blue), accessory (bottom, purple).
  const equipment = creature.equipment || {};
  const slotDots = [
    { key: 'head', dx: -14, dy: -14, color: 0xe8a33d },
    { key: 'body', dx: 14, dy: -14, color: 0x4d8fe8 },
    { key: 'accessory', dx: 0, dy: 18, color: 0xb06be8 }
  ];
  slotDots.forEach(({ key, dx, dy, color }) => {
    if (!equipment[key]) return;
    const dot = scene.add.circle(dx, dy, 4, color).setStrokeStyle(1, 0x1a1410);
    container.add(dot);
  });

  // Working creatures are shown dimmer plus a small spinning gold badge.
  if (isWorking) {
    if (gfx) gfx.setAlpha(0.65);

    const badge = scene.add.graphics({ x: 0, y: -34 });
    badge.fillStyle(0xe8a33d, 1);
    badge.lineStyle(1, 0x2b2118, 1);
    const gearPoints = [
      [4, -10],
      [10, -4],
      [10, 4],
      [4, 10],
      [-4, 10],
      [-10, 4],
      [-10, -4],
      [-4, -10]
    ];
    badge.beginPath();
    badge.moveTo(gearPoints[0][0], gearPoints[0][1]);
    for (let i = 1; i < gearPoints.length; i++) {
      badge.lineTo(gearPoints[i][0], gearPoints[i][1]);
    }
    badge.closePath();
    badge.fillPath();
    badge.strokePath();
    container.add(badge);

    scene.tweens.add({
      targets: badge,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  // Gentle idle bob (sprites carry their own motion in the sheet instead)
  if (!sprite) {
    scene.tweens.add({
      targets: container,
      y: y - 6,
      duration: 700 + index * 80,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // Legendary pulse
  if (border.pulse) {
    scene.tweens.add({
      targets: container,
      scale: 1.12,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // Rare+ ambient particles
  if (border.particles) {
    scene.add.particles(x, y, 'spark', {
      tint: TYPE_COLORS[type] || 0xe8a33d,
      speed: { min: 4, max: 12 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 900,
      frequency: 350,
      quantity: 1
    });
  }

  scene.add
    .text(x, y + 30, (creature.nickname || 'Unnamed') + (isWorking ? '\n(working)' : ''), {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: isWorking ? '#e8a33d' : '#f4ecd8',
      align: 'center'
    })
    .setOrigin(0.5);
}

// Renders a row of small clickable "job station" icons - one per job in a
// category room, just below the wall. Clicking one shows its requirements/
// pay in the shared detail panel. This is intentionally read-only: actual
// job assignment still happens through the React "Assign a Job" panel, to
// avoid duplicating that form/logic inside Phaser (forms are much easier to
// build and validate in React than in a canvas).
export function layoutJobStations(scene, jobs, width, wallHeight, showDetail, accentColor) {
  if (jobs.length === 0) return;

  // Wrap into multiple rows once a category has more than maxPerRow jobs
  // (Labor and Service both have 12) instead of squeezing everything into
  // one cramped row.
  const maxPerRow = 8;
  const rowHeight = 34;

  jobs.forEach((job, index) => {
    const row = Math.floor(index / maxPerRow);
    const colIndexInRow = index % maxPerRow;
    const itemsInThisRow = Math.min(maxPerRow, jobs.length - row * maxPerRow);
    const spacing = Math.min(56, (width - 40) / Math.max(itemsInThisRow - 1, 1));
    const startX = (width - spacing * (itemsInThisRow - 1)) / 2;
    const x = itemsInThisRow === 1 ? width / 2 : startX + colIndexInRow * spacing;
    const y = wallHeight + 18 + row * rowHeight;

    const icon = scene.add
      .rectangle(x, y, 26, 20, accentColor, 0.9)
      .setStrokeStyle(1, 0x1a1410)
      .setInteractive({ useHandCursor: true });

    scene.add.text(x, y, '💼', { fontSize: '10px' }).setOrigin(0.5);

    scene.add
      .text(x, y + 16, job.name.length > 10 ? job.name.slice(0, 9) + '…' : job.name, {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#f4ecd8'
      })
      .setOrigin(0.5, 0);

    icon.on('pointerover', () => icon.setAlpha(1));
    icon.on('pointerout', () => icon.setAlpha(0.9));
    icon.on('pointerdown', () => showDetail(jobSummaryText(job)));
  });
}

// Lays out a list of creatures in a grid starting at (startX, rowY),
// wrapping into rows going upward. Shared layout math for both scenes.
export function layoutCreatures(scene, creatures, width, height, showDetail, options = {}) {
  const startX = options.startX ?? 60;
  const spacing = options.spacing ?? 70;
  const rowY = options.rowY ?? height - 90;
  const perRow = Math.max(Math.floor((width - startX) / spacing), 1);

  creatures.forEach((creature, index) => {
    const col = index % perRow;
    const row = Math.floor(index / perRow);
    const x = startX + col * spacing;
    const y = rowY - row * 70;
    renderCreature(scene, creature, x, y, index, showDetail);
  });
}
