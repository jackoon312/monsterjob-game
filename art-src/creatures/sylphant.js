// Sylphant - Common Nature. A gentle mint-green baby elephant whose ears
// are broad leaves, with fronds sprouting from the top of its head.
const { part, flipX, Frame } = require('../lib/sprite');
const { stampFace, animate, body } = require('../lib/rig');

const P = (rows) =>
  part(rows, { M: 'mint', m: 'mintShade', p: 'blush', G: 'leaf', g: 'leafDark', L: 'leafLight', c: 'cream' });

const EAR_L = P(['...GG.', '..GGGG', '.GGgGG', 'GGGgGG', 'GGgGGG', 'GGgGGG', 'GGGgGG', '.GGgGG', '..GGGG', '...GG.']);
const EAR_R = flipX(EAR_L);

const FRONDS = [
  P(['....LL....', '.G..LL..G.', '.GG.LL.GG.', '..GGLLGG..', '...GLLG...']),
  P(['....LL....', 'G...LL...G', 'GGG.LL.GGG', '..GGLLGG..', '...GLLG...']),
  P(['...LL.....', '.G.LL...G.', '.GG.LL.GG.', '..GGLLGG..', '...GLLG...'])
];

const HEAD = P([
  '...MMMMMMMM...',
  '.MMMMMMMMMMMM.',
  'MMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMM',
  'MppMMMMMMMMppM',
  'mMMMMMMMMMMMMm',
  '.mMMMMMMMMMMm.',
  '..mmMMMMMMmm..',
  '....mmmmmm....'
]);

// The trunk is shaded into the face (no hard outline between the eyes);
// only its tip, which hangs below the chin, gets the dark outline.
const TRUNK = P(['mMMm', 'mMMm', 'mMMm', 'mMMm', 'mMMm']);
const TRUNK_TIP = P(['MMMM', '.MM.']);
const BODY = body({ B: 'mint', b: 'mintShade', n: 'cream' });

function draw(beat) {
  const f = new Frame();
  const headY = 9 + beat.headDy - beat.lift;
  const bodyY = 20 - beat.lift;
  f.stamp(beat.airborne ? BODY.tuck : BODY.stand, 11, bodyY);
  f.stamp(EAR_L, 4, headY);
  f.stamp(EAR_R, 22, headY);
  f.stamp(FRONDS[beat.flicker], 11, headY - 4);
  f.stamp(HEAD, 9, headY);
  stampFace(f, { eyes: beat.eyes, left: [10, headY + 3], right: [19, headY + 3] });
  f.stamp(TRUNK_TIP, 14, headY + 12);
  f.stamp(TRUNK, 14, headY + 7, { outline: false });
  return f;
}

module.exports = { species: 'Sylphant', frames: animate(draw) };
