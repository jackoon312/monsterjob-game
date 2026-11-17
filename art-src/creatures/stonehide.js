// Stonehide - Common Rock. A steady little turtle carrying a cracked
// granite shell on its back.
const { part, Frame } = require('../lib/sprite');
const { stampFace, animate } = require('../lib/rig');

const P = (rows) =>
  part(rows, { S: 'stone', s: 'stoneDark', T: 'stoneLight', O: 'outline', G: 'leaf', g: 'leafDark', L: 'leafLight', p: 'blush' });

const SHELL = P([
  '......SSSSSS......',
  '....SSTTTTSSSS....',
  '..SSSTTSSSSSSSSS..',
  '.SSSTSSSSSOSSSSSS.',
  '.SSSSSSSSSOSSSSSS.',
  'SSSSSSSSSOSSSSSSSS',
  'SSSSSSSSSSOOSSSSSS',
  'SSSSSSSSSSSSOSSSSS',
  'SSSSSSSSSSSSOSSSSS',
  'sSSSSSSSSSSSSSSSSs',
  'ssSSSSSSSSSSSSSSss',
  'TTTTTTTTTTTTTTTTTT',
  '.TTTTTTTTTTTTTTTT.',
  '..ssssssssssssss..'
]);

const HEAD = P([
  '...GGGGGGGG...',
  '.GGGLLGGGGGGG.',
  'GGGLGGGGGGGGGG',
  'GGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGG',
  'GppGGGGGGGGppG',
  'gGGGGGGGGGGGGg',
  '.ggGGGGGGGGgg.',
  '...gggggggg...'
]);

const LEG = P(['GGGG', 'GGGG', 'GGGG', 'gggg']);
const LEG_TUCKED = P(['GGGG', 'GGGG', 'gggg']);

function draw(beat) {
  const f = new Frame();
  const headY = 14 + beat.headDy - beat.lift;
  const leg = beat.airborne ? LEG_TUCKED : LEG;
  f.stamp(leg, 12, 25 - beat.lift);
  f.stamp(leg, 23, 25 - beat.lift);
  f.stamp(SHELL, 11, 11 - beat.lift);
  f.stamp(HEAD, 2, headY);
  stampFace(f, { eyes: beat.eyes, left: [3, headY + 3], right: [12, headY + 3], mouth: [7, headY + 7] });
  return f;
}

module.exports = { species: 'Stonehide', frames: animate(draw) };
