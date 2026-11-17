// Infernodrake - Uncommon Fire. A proud little crimson dragon. Instead of a
// burning tail it carries a smouldering coal on a club tail, with a glowing
// ember gem set in its forehead.
const { part, flipX, Frame } = require('../lib/sprite');
const { stampFace, animate, body } = require('../lib/rig');

const LEGEND = { w: 'white', R: 'fireDark', r: 'brownDark', h: 'fire', c: 'cream', d: 'creamShade', y: 'flame', f: 'flameCore', p: 'blush', O: 'outline' };
const P = (rows) => part(rows, LEGEND);

const HORN_L = P(['c.', 'cc', 'cd']);
const HORN_R = flipX(HORN_L);
const FANG = P(['w']);

const HEAD = P([
  '....RRRRRRRR....',
  '..RRRhhRRRRRRR..',
  '.RRRhRRyyRRRRRR.',
  'RRRRRRyffyRRRRRR',
  'RRRRRRRyyRRRRRRR',
  'RRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRR',
  'RRRRRcOccOcRRRRR',
  'rppRccccccccRppr',
  '.rRRccccccccRRr.',
  '..rrRddddddRrr..',
  '....rrrrrrrr....'
]);

const BODY = body({ B: 'fireDark', b: 'brownDark', n: 'creamShade' });

const WING_L = P(['h....', 'hh...', 'hhh..', 'RhhhR', 'RRhRR', '.R.R.']);
const WING_R = flipX(WING_L);

// club tail: a coal that glows brighter and dimmer
const coal = (a, b) => P(['....rrrr.', `...r${a}${a}${a}rr`, `...r${a}${b}${b}${a}r`, `...rr${a}${a}rr`, 'RRRRrrrr.', '.RRR.....']);
const TAILS = [coal('y', 'f'), coal('y', 'y'), coal('h', 'y')];
const TAIL_FLARE = coal('f', 'f');

function draw(beat) {
  const f = new Frame();
  const headY = 9 + beat.headDy - beat.lift;
  const bodyY = 20 - beat.lift;
  const wingY = bodyY - 4 - (beat.airborne ? 2 : 0);
  f.stamp(beat.flare ? TAIL_FLARE : TAILS[beat.flicker], 19, bodyY + 3);
  f.stamp(WING_L, 4, wingY);
  f.stamp(WING_R, 23, wingY);
  f.stamp(beat.airborne ? BODY.tuck : BODY.stand, 11, bodyY);
  f.stamp(HORN_L, 10, headY - 2);
  f.stamp(HORN_R, 20, headY - 2);
  f.stamp(HEAD, 8, headY);
  stampFace(f, { eyes: beat.eyes, left: [10, headY + 3], right: [19, headY + 3], mouth: [14, headY + 9] });
  f.stamp(FANG, 18, headY + 10, { outline: false }); // one tiny fang
  return f;
}

module.exports = { species: 'Infernodrake', frames: animate(draw) };
