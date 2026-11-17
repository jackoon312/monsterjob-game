// Irongolem - Uncommon Metal. A dutiful little golem of river stone and
// scrap: a pebble head under a riveted steel cap, one big stone fist, one
// thin pipe arm, a glowing core behind a grate - and a brass wind-up key
// that turns on top of its head.
const { part, Frame } = require('../lib/sprite');
const { stampFace, animate } = require('../lib/rig');

const LEGEND = { T: 'stoneLight', S: 'stone', s: 'stoneDark', M: 'steel', m: 'steelDark', Y: 'volt', C: 'spark', p: 'blush' };
const P = (rows) => part(rows, LEGEND);

const HEAD = P([
  '...MMMMMMMM...',
  '.MMMMMMMMMMMM.',
  'MYMMMMMMMMMMYM',
  'mmmmmmmmmmmmmm',
  'TTTTTTTTTTTTTT',
  'TTTTTTSTTTTTTT',
  'TTTTTTTSTTTTTT',
  'TTTTTTTTTTTTTT',
  'SppTTTTTTTTppS',
  '.STTTTTTTTTTS.',
  '..SSSSSSSSSS..'
]);

// the key seen face-on, turning, and edge-on
const KEYS = [
  P(['YY.YY', 'YYYYY', 'YY.YY', '..Y..']),
  P(['.YYY.', '.YYY.', '.YYY.', '..Y..']),
  P(['..Y..', '..Y..', '..Y..', '..Y..'])
];

const torso = (core) =>
  P(['..SSSSSSSS..', '.SSTTTTTTSS.', 'MMMMMMMMMMMM', `SSTTm${core}${core}mTTSS`, `sSTTm${core}${core}mTTSs`, 'sSSTTTTTTSSs']);
const TORSO = { lit: torso('C'), dim: torso('M') };
const FEET = P(['.mmm....mmm.', '.mmm....mmm.']);
const FEET_TUCK = P(['.mmm....mmm.']);

const FIST = P(['.SSS.', 'STTSS', 'STSSS', 'SSSSs', '.sss.']);
const PIPE = P(['MM.', 'MM.', 'MM.', 'mMM', 'M.M', 'M.M']);

function draw(beat) {
  const f = new Frame();
  const headY = 10 + beat.headDy - beat.lift;
  const bodyY = 21 - beat.lift;
  const armY = bodyY + (beat.airborne ? -1 : 1);
  f.stamp(beat.airborne ? FEET_TUCK : FEET, 10, bodyY + 6);
  f.stamp(beat.flicker === 2 && !beat.flare ? TORSO.dim : TORSO.lit, 10, bodyY);
  f.stamp(FIST, 5, armY);
  f.stamp(PIPE, 23, armY - 1);
  f.stamp(KEYS[beat.flicker], 14, headY - 4);
  f.stamp(HEAD, 9, headY);
  stampFace(f, { eyes: beat.eyes, left: [10, headY + 4], right: [19, headY + 4], mouth: [14, headY + 8] });
  return f;
}

module.exports = { species: 'Irongolem', frames: animate(draw) };
