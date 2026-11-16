// Flamicore - Common Fire. A small fox with a gentle flame at the tip of
// its tail. Front-facing chibi: big head, big eyes, stubby paws.
const { part, Frame } = require('../lib/sprite');

const LEGEND = {
  O: 'outline',
  w: 'white',
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

const EYES = {
  open: ['RROOORRRRRROOORR', 'RRwOORRRRRRwOORR', 'RcOOOccccccOOOcR', 'rpOOOccccccOOOpr'],
  blink: ['RRRRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRRR', 'RcOOOccccccOOOcR', 'rpccccccccccccpr'],
  happy: ['RRRRRRRRRRRRRRRR', 'RRRORRRRRRRRORRR', 'RcOcOccccccOcOcR', 'rpccccccccccccpr']
};

const head = (eyes) =>
  P([
    '..r..........r..',
    '.RRR........RRR.',
    '.RpRR.RRRR.RRpR.',
    '.RppRRRRRRRRppR.',
    '.RRpRhhhRRRRpRR.',
    'RRRRhRRRRRRRRRRR',
    ...EYES[eyes],
    'rppcccOccOcccppr',
    '.rcccccOOcccccr.',
    '..rddccccccddr..',
    '....rddddddr....'
  ]);

const BODIES = {
  stand: P([
    '..RRRRRR..',
    '.RRccccRR.',
    'RRccccccRR',
    'RRccccccRR',
    'rRccccccRr',
    'rRRccccRRr',
    'rRRRRRRRRr',
    '.RRR..RRR.',
    '.rrr..rrr.'
  ]),
  // airborne: paws tucked up one row
  tuck: P([
    '..RRRRRR..',
    '.RRccccRR.',
    'RRccccccRR',
    'RRccccccRR',
    'rRccccccRr',
    'rRRccccRRr',
    'rRRRRRRRRr',
    '.rrr..rrr.'
  ])
};

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

// lift: whole creature moves up by this many pixels (a hop).
// headDy: head sinks relative to the body (breathing / landing squash).
function pose({ eyes = 'open', headDy = 0, flame = 'a', lift = 0, body = 'stand' } = {}) {
  const f = new Frame();
  const tail = TAILS[flame];
  f.stamp(tail, 16, 28 - tail.h - lift);
  f.stamp(BODIES[body], 6, 20 - lift);
  f.stamp(head(eyes), 3, 7 + headDy - lift);
  return f;
}

module.exports = {
  species: 'Flamicore',
  frames: {
    // Breathing with a flickering tail flame; one blink per loop.
    idle: [
      pose({ flame: 'a' }),
      pose({ flame: 'b' }),
      pose({ flame: 'c', headDy: 1 }),
      pose({ flame: 'a', headDy: 1 }),
      pose({ flame: 'b' }),
      pose({ flame: 'c', eyes: 'blink' })
    ],
    // A busy little hop: crouch, spring, flare, land.
    work: [
      pose({ flame: 'c', headDy: 1 }),
      pose({ flame: 'a', lift: 2, body: 'tuck', eyes: 'happy' }),
      pose({ flame: 'big', lift: 3, body: 'tuck', eyes: 'happy' }),
      pose({ flame: 'big', lift: 1, body: 'tuck', eyes: 'happy' }),
      pose({ flame: 'c', headDy: 1 }),
      pose({ flame: 'b' })
    ]
  }
};
