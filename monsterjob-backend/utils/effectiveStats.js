// Shared helper: computes a creature's effective stats by applying its
// equipped items' percentage bonuses on top of base stats. Equipment
// statBonus values are stored as flat percentages (e.g. 5 = +5%), matching
// the spec ("+5% Strength, +10% Intelligence, etc."), applied additively
// across all 3 slots before being applied to the base stat.
//
// IMPORTANT: the creature passed in must already have equipment.head/body/accessory
// populated (not just ObjectIds) - callers are responsible for that via
// .populate('equipment.head').populate('equipment.body').populate('equipment.accessory')

const STAT_KEYS = ['strength', 'intelligence', 'stamina', 'charisma', 'speed', 'health'];

const calculateEffectiveStats = (creature) => {
  const equippedItems = [creature.equipment.head, creature.equipment.body, creature.equipment.accessory].filter(
    (item) => item && typeof item === 'object' && item.statBonus
  );

  const bonusPercent = {};
  STAT_KEYS.forEach((key) => {
    bonusPercent[key] = 0;
  });

  for (const item of equippedItems) {
    STAT_KEYS.forEach((key) => {
      bonusPercent[key] += item.statBonus[key] || 0;
    });
  }

  const effectiveStats = {};
  STAT_KEYS.forEach((key) => {
    const base = creature.stats[key] || 0;
    effectiveStats[key] = Math.round(base * (1 + bonusPercent[key] / 100));
  });

  return effectiveStats;
};

module.exports = { calculateEffectiveStats };
