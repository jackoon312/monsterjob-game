// Master palette for all MonsterJob art (max 32 colours). Every sprite may
// only use colours listed here; build.js enforces it. Colours are built
// outward from the ones the game UI already uses (see src/index.css and
// TYPE_COLORS in creatureRenderer.js).
const MASTER = {
  outline: '#1a1410', // warm dark outline, never pure black
  white: '#ffffff', // eye highlight
  cream: '#f4ecd8',
  creamShade: '#d9c09a',
  blush: '#f08a7a',

  // Fire ramp
  fireDark: '#b23e2a',
  fire: '#e8643d',
  fireLight: '#f79a52',
  flame: '#fbd35a',
  flameCore: '#fff3b8',

  // Water ramp
  waterDark: '#2f5fb0',
  water: '#4d8fe8',
  waterLight: '#9fd0f7',

  // Earth / fur ramp
  brownDark: '#5a3f2c',
  brown: '#8f6a48',
  brownLight: '#c29a70',

  // Stone ramp (also soft grey skin)
  stoneDark: '#5e5a60',
  stone: '#8f8a8c',
  stoneLight: '#c4bdb6',

  // Electric ramp (flameCore doubles as its highlight)
  voltDark: '#c98f2a',
  volt: '#f2cf3f',
  spark: '#7fe3e8',

  // Nature ramp
  leafDark: '#3f6b45',
  leaf: '#6b8f5a',
  leafLight: '#a9c96e',
  mint: '#c3e3c4',
  mintShade: '#8fbf9e'
};

const hexToRGBA = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
  255
];

if (Object.keys(MASTER).length > 32) throw new Error('Master palette exceeds 32 colours');

module.exports = { MASTER, hexToRGBA };
