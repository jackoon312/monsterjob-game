// Tidecoral - Uncommon Water. A serene sea calf with branching coral
// antlers whose tips pulse with bioluminescent light.
const { part, flipX, Frame } = require('../lib/sprite');
const { stampFace, animate } = require('../lib/rig');

const LEGEND = { W: 'water', D: 'waterDark', L: 'waterLight', c: 'cream', k: 'blush', p: 'blush', C: 'spark' };
const P = (rows) => part(rows, LEGEND);

// t = antler tips (lit or dim)
const antler = (t) => P([`${t}..${t}..`, `k..k.${t}`, 'kk.k.k', '.kkkkk', '..kkk.', '..kk..']);
const ANTLERS = { lit: antler('C'), dim: antler('L') };

const HEAD = P([
  '....WWWWWWWW....',
  '..WWWLLWWWWWWW..',
  '.WWWLWWWWWWWCWW.',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWW',
  'WWWWWccccccWWWWW',
  'WWWWccccccccWWWW',
  'DppWccccccccWppD',
  '.DWWWccccccWWWD.',
  '..DDWWWWWWWWDD..',
  '....DDDDDDDD....'
]);

const BODY = P(['..WWWWWW..', '.WWccccWW.', 'WWccccccWW', 'WWccccccWW', 'DWccccccWD', 'DWWccccWWD', '.DWWWWWWD.', '..DDDDDD..']);
const FLIP_L = P(['.WWW', 'WWWD', 'DDD.']);
const FLIP_R = flipX(FLIP_L);
const FLUKE = P(['W....W', 'WW..WW', 'WWWWWW', '.WCCW.', '..WD..', '.WWD..']);

function draw(beat) {
  const f = new Frame();
  const headY = 10 + beat.headDy - beat.lift;
  const bodyY = 21 - beat.lift;
  const flipY = bodyY + (beat.airborne ? 2 : 4);
  const antlers = beat.flicker === 2 && !beat.flare ? ANTLERS.dim : ANTLERS.lit;
  f.stamp(FLUKE, 22, bodyY - 2);
  f.stamp(BODY, 11, bodyY);
  f.stamp(FLIP_L, 8, flipY);
  f.stamp(FLIP_R, 20, flipY);
  f.stamp(antlers, 9, headY - 5);
  f.stamp(flipX(antlers), 17, headY - 5);
  f.stamp(HEAD, 8, headY);
  stampFace(f, { eyes: beat.eyes, left: [10, headY + 3], right: [19, headY + 3], mouth: [14, headY + 8] });
  return f;
}

module.exports = { species: 'Tidecoral', frames: animate(draw) };
