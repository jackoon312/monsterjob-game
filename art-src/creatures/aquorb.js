// Aquorb - Common Water. A calm little jellyfish: the bell is its whole
// head, with short tentacles that sway underneath.
const { part, Frame } = require('../lib/sprite');
const { stampFace, animate } = require('../lib/rig');

const P = (rows) => part(rows, { W: 'water', D: 'waterDark', L: 'waterLight', p: 'blush' });

const BELL = P([
  '.......WWWWWW.......',
  '.....WWLLLLWWWW.....',
  '...WWLLLWWWWWWWWW...',
  '..WWLLWWWWWWWWWWWW..',
  '.WWLLWWWWWWWWWWWWWW.',
  '.WWLWWWWWWWWWWWWWWW.',
  'WWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWW',
  'WWppWWWWWWWWWWWWppWW',
  'DWWWWWWWWWWWWWWWWWWD',
  'DDWWWWWWWWWWWWWWWWDD',
  '.DDDLLLLLLLLLLLLDDD.',
  '.DD.DDDD.DD.DDDD.DD.'
]);

const TENTACLES = [
  P(['...LL..LL..LL..LL...', '...LL..LL..LL..LL...', '...LL..LL..LL..LL...', '...WW..LL..LL..WW...', '.......WW..WW.......']),
  P(['...LL..LL..LL..LL...', '...LL..LL..LL..LL...', '....LL..LL..LL..LL..', '....WW..LL..LL..WW..', '........WW..WW......']),
  P(['...LL..LL..LL..LL...', '...LL..LL..LL..LL...', '..LL..LL..LL..LL....', '..WW..LL..LL..WW....', '......WW..WW........'])
];
// airborne: tentacles trail shorter
const TUCKED = P(['...LL..LL..LL..LL...', '...LL..LL..LL..LL...', '...WW..WW..WW..WW...']);

function draw(beat) {
  const f = new Frame();
  const bellY = 9 + beat.headDy - beat.lift;
  f.stamp(beat.airborne ? TUCKED : TENTACLES[beat.flicker], 6, 24 - beat.lift);
  f.stamp(BELL, 6, bellY);
  stampFace(f, { eyes: beat.eyes, left: [10, bellY + 7], right: [19, bellY + 7], mouth: [14, bellY + 11] });
  return f;
}

module.exports = { species: 'Aquorb', frames: animate(draw) };
