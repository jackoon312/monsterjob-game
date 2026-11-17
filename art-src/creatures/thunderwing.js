// Thunderwing - Uncommon Electric. A chubby storm-cloud-grey chick with a
// single lightning-bolt crest. Its wings throw sparks when it flaps.
const { part, flipX, Frame } = require('../lib/sprite');
const { stampFace, animate } = require('../lib/rig');

const LEGEND = { S: 'stone', s: 'stoneDark', T: 'stoneLight', Y: 'volt', v: 'voltDark', C: 'spark', p: 'blush' };
const P = (rows) => part(rows, LEGEND);

const BLOB = P([
  '....SSSSSSSS....',
  '..SSSSSSSSSSSS..',
  '.SSSSSSSSSSSSSS.',
  'SSSSSSSSSSSSSSSS',
  'SSSSTTTTTTTTSSSS',
  'SSSTTTTTTTTTTSSS',
  'SSSTTTTTTTTTTSSS',
  'SSSTTTTYYTTTTSSS',
  'SSSTTTTvvTTTTSSS',
  'SSppTTTTTTTTppSS',
  'sSSSTTTTTTTTSSSs',
  'sSSTTTTTTTTTTSSs',
  'sSSTTTTTTTTTTSSs',
  '.sSSTTTTTTTTSSs.',
  '..ssSSSSSSSSss..',
  '....ssssssss....'
]);

const CREST = P(['...YY', '..YY.', '.YYYY', '..YY.', '.YY..', '.Y...']);
const FOOT = P(['.Y.', 'YYY', 'Y.Y']);
const WING_DOWN_L = P(['..ss', '.sss', 'ssss', 'ssss', 'ssss', 'sssY', '.sYY', '..Y.']);
const WING_UP_L = P(['Y.....', 'YYs...', '.Ysss.', '..ssss', '...sss', '....ss']);
const SPARK = P(['C']);

function draw(beat) {
  const f = new Frame();
  const y = 10 + beat.headDy - beat.lift;
  if (!beat.airborne) {
    f.stamp(FOOT, 11, 26);
    f.stamp(FOOT, 18, 26);
  } else {
    f.stamp(FOOT, 11, 25 - beat.lift);
    f.stamp(FOOT, 18, 25 - beat.lift);
  }
  f.stamp(CREST, 13, y - 5);
  if (beat.airborne) {
    f.stamp(WING_UP_L, 3, y + 1);
    f.stamp(flipX(WING_UP_L), 23, y + 1);
  } else {
    f.stamp(WING_DOWN_L, 4, y + 6);
    f.stamp(flipX(WING_DOWN_L), 24, y + 6);
  }
  f.stamp(BLOB, 8, y);
  stampFace(f, { eyes: beat.eyes, left: [11, y + 5], right: [18, y + 5] });
  if (beat.flare) {
    f.stamp(SPARK, 1, y + 4);
    f.stamp(SPARK, 30, y + 4);
  }
  return f;
}

module.exports = { species: 'Thunderwing', frames: animate(draw) };
