// Flamicore - Common Fire. A small fox with a gentle flame at the tip of
// its tail. Front-facing chibi: big head, big eyes, stubby paws.
const { part, Frame } = require('../lib/sprite');
const { stampFace, animate, body } = require('../lib/rig');

const LEGEND = {
  c: 'cream',
  d: 'creamShade',
  p: 'blush',
  r: 'fireDark',
  R: 'fire',
  h: 'fireLight',
  y: 'flame',
  f: 'flameCore'
};
const P = (rows) => part(rows, LEGEND);

const HEAD = P([
  '..r..........r..',
  '.RRR........RRR.',
  '.RpRR.RRRR.RRpR.',
  '.RppRRRRRRRRppR.',
  '.RRpRhhhRRRRpRR.',
  'RRRRhRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRR',
  'RccccccccccccccR',
  'rpccccccccccccpr',
  'rppccccccccccppr',
  '.rccccccccccccr.',
  '..rddccccccddr..',
  '....rddddddr....'
]);

const BODY = body({ B: 'fire', b: 'fireDark', n: 'cream' });

const TAIL_BASE = [
  '....RhhhhhR.',
  '...RRhRRRRRr',
  '...RhRRRRRRr',
  '...RRRRRRRRr',
  '...RRRRRRRRr',
  '..rRRRRRRRr.',
  '.rrRRRRRRrr.',
  'rrrrRRRrrr..',
  '..rrrrrr....'
];

const FLAMES = {
  a: [
    '.......y....',
    '......yy....',
    '......yyy...',
    '.....yyfyy..',
    '.....yffyy..',
    '....yyfffyy.',
    '....yyfffyy.',
    '....hyyfyyh.',
    '....hhyyyhh.'
  ],
  b: [
    '........y...',
    '.......yy...',
    '......yyy...',
    '.....yyfyy..',
    '.....yyffy..',
    '....yyfffyy.',
    '....yyfffyy.',
    '....hyyfyyh.',
    '....hhyyyhh.'
  ],
  c: [
    '......y.....',
    '......yy....',
    '.....yyyy...',
    '.....yffyy..',
    '....yyfffyy.',
    '....yfffffy.',
    '....hyyfyyh.',
    '....hhyyyhh.'
  ],
  big: [
    '......y.....',
    '......y..y..',
    '.....yy.....',
    '.....yyy....',
    '....yyyfy...',
    '....yyffyy..',
    '....yffffyy.',
    '....yyfffyy.',
    '....yyfffyy.',
    '....hyyfyyh.',
    '....hhyyyhh.'
  ]
};

const TAILS = Object.fromEntries(Object.entries(FLAMES).map(([k, rows]) => [k, P([...rows, ...TAIL_BASE])]));

const FLICKER = ['a', 'b', 'c'];

function draw(beat) {
  const f = new Frame();
  const tail = TAILS[beat.flare ? 'big' : FLICKER[beat.flicker]];
  const headY = 7 + beat.headDy - beat.lift;
  f.stamp(tail, 16, 28 - tail.h - beat.lift);
  f.stamp(beat.airborne ? BODY.tuck : BODY.stand, 6, 20 - beat.lift);
  f.stamp(HEAD, 3, headY);
  stampFace(f, { eyes: beat.eyes, left: [5, headY + 6], right: [14, headY + 6], mouth: [9, headY + 10] });
  return f;
}

module.exports = { species: 'Flamicore', frames: animate(draw) };
