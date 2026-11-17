// Shared building blocks so every creature blinks, breathes and hops the
// same way. A creature module only supplies its own shapes and colours, and
// one draw(beat) function; animate() turns that into the idle and work rows.
const { part } = require('./sprite');

const FACE = { O: 'outline', w: 'white' };

// Standard 3x4 eye. Stamped over the head with no outline of its own, so
// '.' lets the fur underneath show through.
const EYES = {
  open: part(['OOO', 'wOO', 'OOO', 'OOO'], FACE),
  blink: part(['...', '...', 'OOO', '...'], FACE),
  happy: part(['...', '.O.', 'O.O', '...'], FACE)
};

const SMILE = part(['O..O', '.OO.'], FACE);

// left / right: top-left corner of each eye. mouth: top-left of the smile
// (omit for creatures whose mouth is hidden).
function stampFace(frame, { eyes = 'open', left, right, mouth }) {
  frame.stamp(EYES[eyes], left[0], left[1], { outline: false });
  frame.stamp(EYES[eyes], right[0], right[1], { outline: false });
  if (mouth) frame.stamp(SMILE, mouth[0], mouth[1], { outline: false });
}

// One beat = one frame of animation.
//   lift     whole creature moves up this many pixels (a hop)
//   headDy   head sinks this many pixels (breathing in / landing squash)
//   airborne feet are off the ground - draw them tucked
//   eyes     'open' | 'blink' | 'happy'
//   flicker  0..2, a free-running cycle for secondary motion (flame, sparks,
//            tentacles, leaves)
//   flare    the peak of the hop - secondary motion may exaggerate here
const beat = (b) => ({ lift: 0, headDy: 0, airborne: false, eyes: 'open', flicker: 0, flare: false, ...b });

// Idle (6 fps): breathing, one blink per loop.
const IDLE_BEATS = [
  beat({ flicker: 0 }),
  beat({ flicker: 1 }),
  beat({ flicker: 2, headDy: 1 }),
  beat({ flicker: 0, headDy: 1 }),
  beat({ flicker: 1 }),
  beat({ flicker: 2, eyes: 'blink' })
];

// Work (8 fps): a busy little hop - crouch, spring, peak, fall, land, recover.
const WORK_BEATS = [
  beat({ flicker: 2, headDy: 1 }),
  beat({ flicker: 0, lift: 2, airborne: true, eyes: 'happy' }),
  beat({ flicker: 1, lift: 3, airborne: true, eyes: 'happy', flare: true }),
  beat({ flicker: 2, lift: 1, airborne: true, eyes: 'happy', flare: true }),
  beat({ flicker: 2, headDy: 1 }),
  beat({ flicker: 1 })
];

const animate = (draw) => ({ idle: IDLE_BEATS.map(draw), work: WORK_BEATS.map(draw) });

// Shared small rounded body with two stubby front paws. Legend must map
// B (base), b (shade) and n (belly) to palette names.
const BODY_ROWS = [
  '..BBBBBB..',
  '.BBnnnnBB.',
  'BBnnnnnnBB',
  'BBnnnnnnBB',
  'bBnnnnnnBb',
  'bBBnnnnBBb',
  'bBBBBBBBBb'
];
const body = (legend) => ({
  stand: part([...BODY_ROWS, '.BBB..BBB.', '.bbb..bbb.'], legend),
  tuck: part([...BODY_ROWS, '.bbb..bbb.'], legend) // paws pulled up one row
});

module.exports = { EYES, SMILE, stampFace, IDLE_BEATS, WORK_BEATS, animate, body };
