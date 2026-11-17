// Barkbeast - Uncommon Nature. A wolf pup with a coat of bark, a thick mane
// of moss around its neck and a drop of glowing amber sap on its forehead.
const { part, flipX, Frame } = require('../lib/sprite');
const { stampFace, animate, body } = require('../lib/rig');

const LEGEND = { B: 'brown', b: 'brownDark', n: 'brownLight', G: 'leaf', g: 'leafDark', L: 'leafLight', y: 'flame', p: 'blush', O: 'outline' };
const P = (rows) => part(rows, LEGEND);

const EAR_L = P(['..B.', '.BB.', '.BbB', 'BBbB', 'BBBB']);
const EAR_R = flipX(EAR_L);

const MANE = P([
  '..GG..............GG..',
  '.GGGGGGGGGGGGGGGGGGGG.',
  'GGLGGGGGGGGGGGGGGGGLGG',
  'GGGGGGGGGGGGGGGGGGGGGG',
  '.GGGGGGGGGGGGGGGGGGGG.',
  'GGLGGGGGGGGGGGGGGGGLGG',
  'GGGGGGGGGGGGGGGGGGGGGG',
  '.gGGGgGGLGGGGLGGgGGGg.',
  '..ggGGGgGGGGGGgGGGgg..',
  '....gg.ggg..ggg.gg....'
]);

const HEAD = P([
  '....BBGGGGBB....',
  '..BBBGLGGGBBBB..',
  '.BbBBBGyyGBBBbB.',
  'BBbBBBByyBBBBbBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBnnnnBBBBBB',
  'BBBBBnnOOnnBBBBB',
  'bppBnnnnnnnnBppb',
  '.bBBnnnnnnnnBBb.',
  '..bbBnnnnnnBbb..',
  '....bbbbbbbb....'
]);

const BODY = body({ B: 'brown', b: 'brownDark', n: 'brownLight' });
const TAIL = P(['..GG.', '.GLGG', '.GGGG', '.BBBg', 'BBBb.', 'BBb..', 'bb...']);

function draw(beat) {
  const f = new Frame();
  const headY = 9 + beat.headDy - beat.lift;
  const bodyY = 20 - beat.lift;
  f.stamp(TAIL, 22, bodyY + (beat.flicker === 1 ? 0 : 1));
  f.stamp(beat.airborne ? BODY.tuck : BODY.stand, 11, bodyY);
  f.stamp(MANE, 5, headY + 4);
  f.stamp(EAR_L, 8, headY - 4);
  f.stamp(EAR_R, 20, headY - 4);
  f.stamp(HEAD, 8, headY);
  stampFace(f, { eyes: beat.eyes, left: [10, headY + 3], right: [19, headY + 3], mouth: [14, headY + 9] });
  return f;
}

module.exports = { species: 'Barkbeast', frames: animate(draw) };
