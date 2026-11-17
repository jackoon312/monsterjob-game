// Terramole - Common Rock. A squat mole with a pointed snout, a big pink
// nose, oversized digging claws and three stone plates along its back.
const { part, flipX, Frame } = require('../lib/sprite');
const { stampFace, animate } = require('../lib/rig');

const P = (rows) =>
  part(rows, { B: 'brown', b: 'brownDark', n: 'brownLight', p: 'blush', c: 'cream', T: 'stoneLight', S: 'stone', s: 'stoneDark' });

const PLATE_MID = P(['..TTTT..', '.TTSSSS.', 'TTSSSSSs', 'TSSSSSss', 'SSSSSsss']);
const PLATE_L = P(['.TTT.', 'TTSSs', 'TSSSs', 'SSSss']);
const PLATE_R = flipX(PLATE_L);

const HEAD = P([
  '....BBBBBBBB....',
  '..BBBnnnBBBBBB..',
  '.BBBnBBBBBBBBBB.',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'bBBBBBnnnnBBBBBb',
  'bBBBBnnnnnnBBBBb',
  '.bBBBnnppnnBBBb.',
  '..bBBBnppnBBBb..',
  '...bbnnnnnnbb...',
  '.....bnnnnb.....'
]);

const BODY = P([
  '..BBBBBBBB..',
  '.BBnnnnnnBB.',
  'BBnnnnnnnnBB',
  'BBnnnnnnnnBB',
  'bBnnnnnnnnBb',
  'bBBnnnnnnBBb',
  'bBBBBBBBBBBb',
  '.bbb....bbb.'
]);
const BODY_TUCK = P(BODY.rows.slice(0, 7));

const CLAW = P(['.BBB.', 'BBBBB', 'BBBBB', 'cBcBc', 'c.c.c']);

function draw(beat) {
  const f = new Frame();
  const headY = 8 + beat.headDy - beat.lift;
  const bodyY = 21 - beat.lift;
  const clawY = bodyY + (beat.airborne ? 0 : 2);
  // one continuous ridge across the top of the head, not two "ears"
  f.stamp(PLATE_L, 9, headY - 2);
  f.stamp(PLATE_R, 18, headY - 2);
  f.stamp(PLATE_MID, 12, headY - 4);
  f.stamp(beat.airborne ? BODY_TUCK : BODY, 10, bodyY);
  f.stamp(CLAW, 6, clawY);
  f.stamp(CLAW, 21, clawY);
  f.stamp(HEAD, 8, headY);
  stampFace(f, { eyes: beat.eyes, left: [10, headY + 4], right: [19, headY + 4], mouth: [14, headY + 11] });
  return f;
}

module.exports = { species: 'Terramole', frames: animate(draw) };
