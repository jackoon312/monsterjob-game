// Voltix - Common Electric. A restless cream rabbit with yellow-lined ears,
// a zigzag forehead tuft, a yellow puff tail and static sparks around it.
const { part, flipX, Frame } = require('../lib/sprite');
const { stampFace, animate, body } = require('../lib/rig');

const P = (rows) =>
  part(rows, { c: 'cream', d: 'creamShade', Y: 'volt', v: 'voltDark', p: 'blush', C: 'spark' });

const EAR_L = P(['.ccc.', 'ccYcc', 'cYYc.', 'cYYc.', 'cYYcc', '.cYYc', '.cYcc', '.cccc']);
const EAR_R = flipX(EAR_L);

const HEAD = P([
  '...cccccccccc...',
  '.cccccYYccccccc.',
  '.ccccYYcccccccc.',
  'ccccccYYcccccccc',
  'cccccccccccccccc',
  'cccccccccccccccc',
  'cccccccppccccccc',
  'dccccccccccccccd',
  '.dccccccccccccd.',
  '..ddccccccccdd..',
  '....dddddddd....'
]);

const BODY = body({ B: 'cream', b: 'creamShade', n: 'volt' });
const TAIL = P(['.YYY.', 'YYYYY', 'YYYYY', 'YYYYv', '.Yvv.']);
const SPARK = P(['C']);

// where the static sparks sit on each flicker step
const SPARKS = [
  [[4, 17], [27, 13]],
  [[5, 13], [26, 18]],
  [[3, 21], [28, 16]]
];

function draw(beat) {
  const f = new Frame();
  const headY = 10 + beat.headDy - beat.lift;
  const bodyY = 20 - beat.lift;
  f.stamp(TAIL, 21, bodyY + 3);
  f.stamp(beat.airborne ? BODY.tuck : BODY.stand, 11, bodyY);
  f.stamp(EAR_L, 9, headY - 6);
  f.stamp(EAR_R, 18, headY - 6);
  f.stamp(HEAD, 8, headY);
  stampFace(f, { eyes: beat.eyes, left: [10, headY + 3], right: [19, headY + 3], mouth: [14, headY + 7] });
  SPARKS[beat.flicker].forEach(([x, y]) => f.stamp(SPARK, x, y - beat.lift));
  return f;
}

module.exports = { species: 'Voltix', frames: animate(draw) };
