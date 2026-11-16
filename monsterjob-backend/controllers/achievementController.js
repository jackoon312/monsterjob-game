const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Creature = require('../models/Creature');

// Static catalog of possible achievements. Not stored in the DB as a separate
// model - each entry here is a definition; unlocked instances go in the
// Achievement collection (one document per user per unlocked achievement).
const ACHIEVEMENT_CATALOG = [
  {
    achievementId: 'first_catch',
    name: 'First Catch',
    description: 'Catch your first creature',
    reward: { money: 50, cosmetics: [] },
    check: async (userId) => {
      const count = await Creature.countDocuments({ userId });
      return count >= 1;
    }
  },
  {
    achievementId: 'first_steps',
    name: 'First Steps',
    description: 'Level any creature to 10',
    reward: { money: 100, cosmetics: [] },
    check: async (userId) => {
      const creature = await Creature.findOne({ userId, level: { $gte: 10 } });
      return !!creature;
    }
  },
  {
    achievementId: 'wealthy',
    name: 'Wealthy',
    description: 'Earn 5,000 money total',
    reward: { money: 500, cosmetics: ['golden_office_sign'] },
    check: async (userId) => {
      const creatures = await Creature.find({ userId });
      const totalEarnings = creatures.reduce((sum, c) => sum + c.totalEarnings, 0);
      return totalEarnings >= 5000;
    }
  },
  {
    achievementId: 'job_master',
    name: 'Job Master',
    description: 'Complete 20 jobs',
    reward: { money: 200, cosmetics: [] },
    check: async (userId) => {
      const creatures = await Creature.find({ userId });
      const totalJobs = creatures.reduce((sum, c) => sum + c.totalJobsCompleted, 0);
      return totalJobs >= 20;
    }
  },
  {
    achievementId: 'team_builder',
    name: 'Team Builder',
    description: 'Catch 10 different creatures',
    reward: { money: 300, cosmetics: [] },
    check: async (userId) => {
      const count = await Creature.countDocuments({ userId });
      return count >= 10;
    }
  },
  {
    achievementId: 'legendary_hunter',
    name: 'Legendary Hunter',
    description: 'Catch a Legendary creature',
    reward: { money: 1000, cosmetics: ['legendary_banner'] },
    check: async (userId) => {
      const creatures = await Creature.find({ userId }).populate('creatureSpeciesId');
      return creatures.some((c) => c.creatureSpeciesId?.rarity === 'Legendary');
    }
  }
];

// Core unlock logic, usable both by the HTTP handler below and by other
// controllers that want to auto-check achievements after a relevant action
// (catching a creature, completing a job, etc.). Returns { unlocked, achievement? }
// and never throws for "not met yet" - only for actual errors, which callers
// that use this for auto-checking should catch and swallow rather than fail
// the parent request over.
const attemptUnlock = async (userId, achievementId) => {
  const definition = ACHIEVEMENT_CATALOG.find((a) => a.achievementId === achievementId);
  if (!definition) {
    throw new Error(`Unknown achievement id: ${achievementId}`);
  }

  const alreadyUnlocked = await Achievement.findOne({ userId, achievementId });
  if (alreadyUnlocked) {
    return { unlocked: false, alreadyUnlocked: true, achievement: alreadyUnlocked };
  }

  const passed = await definition.check(userId);
  if (!passed) {
    return { unlocked: false, alreadyUnlocked: false };
  }

  const achievement = await Achievement.create({
    userId,
    achievementId: definition.achievementId,
    name: definition.name,
    description: definition.description,
    reward: definition.reward
  });

  if (definition.reward.money > 0) {
    await User.findByIdAndUpdate(userId, { $inc: { totalMoney: definition.reward.money } });
  }

  return { unlocked: true, achievement };
};

// Attempts several achievement ids in sequence, ignoring "not met" results,
// and returns only the ones that were newly unlocked this call.
const attemptUnlockMany = async (userId, achievementIds) => {
  const newlyUnlocked = [];
  for (const id of achievementIds) {
    const result = await attemptUnlock(userId, id);
    if (result.unlocked) {
      newlyUnlocked.push(result.achievement);
    }
  }
  return newlyUnlocked;
};

// @route GET /api/achievements/all
// Get the full catalog of possible achievements (definitions only, not unlock status)
const getAllAchievements = async (req, res) => {
  const catalog = ACHIEVEMENT_CATALOG.map(({ achievementId, name, description, reward }) => ({
    achievementId,
    name,
    description,
    reward
  }));
  res.status(200).json({ achievements: catalog });
};

// @route GET /api/achievements
// Get the achievements this user has actually unlocked
const getMyAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.user._id }).sort({ unlockedAt: -1 });
    res.status(200).json({ achievements });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
};

// @route POST /api/achievements/:achievementId/check
// HTTP wrapper around attemptUnlock, for a player/client manually checking one.
const checkAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const result = await attemptUnlock(req.user._id, achievementId);

    if (result.alreadyUnlocked) {
      return res.status(200).json({ message: 'Already unlocked', achievement: result.achievement });
    }
    if (!result.unlocked) {
      return res.status(200).json({ unlocked: false, message: 'Requirements not yet met' });
    }

    res.status(201).json({ unlocked: true, achievement: result.achievement });
  } catch (error) {
    if (error.message.startsWith('Unknown achievement id')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error checking achievement', error: error.message });
  }
};

module.exports = {
  getAllAchievements,
  getMyAchievements,
  checkAchievement,
  attemptUnlock,
  attemptUnlockMany
};
