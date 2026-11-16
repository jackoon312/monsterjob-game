const User = require('../models/User');
const Creature = require('../models/Creature');
const JobAssignment = require('../models/JobAssignment');
const { attemptUnlockMany } = require('./achievementController');

const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000; // 8 hour cap, per spec

const DIFFICULTY_MULTIPLIER = { Easy: 1, Normal: 1.25, Hard: 1.5, 'Very Hard': 2 };
const calculateXPReward = (job, creature) => {
  const multiplier = DIFFICULTY_MULTIPLIER[job.difficulty] || 1;
  const levelFactor = Math.max(100 - creature.level, 1) / 100;
  return Math.round(job.baseXPReward * multiplier * levelFactor);
};

// @route GET /api/game/time
// Returns the server's clock, so the client can't fake elapsed offline time
// by manipulating its own device clock.
const getServerTime = (req, res) => {
  res.status(200).json({ serverTime: new Date() });
};

// @route POST /api/game/offline-earnings
// Simulates a creature's job auto-repeating for however long the player was
// away (capped at 8 hours), based on whatever job it was In Progress on when
// they last logged in. Pays out for each full cycle that would have
// completed, resolves the original assignment, and frees the creature.
//
// Simplification vs. checkAndCompleteAssignment: risk factor is NOT applied
// here (every simulated cycle is treated as a success). Applying real risk
// rolls per offline cycle would be more accurate but adds randomness that's
// hard for a player to verify/trust when they weren't there to see it happen -
// worth revisiting once you decide how "fair" offline simulation should feel.
const calculateOfflineEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    const elapsedMs = now - user.lastLoginTime;
    const cappedMs = Math.max(Math.min(elapsedMs, MAX_OFFLINE_MS), 0);

    if (cappedMs < 60 * 1000) {
      user.lastLoginTime = now;
      await user.save();
      return res.status(200).json({
        message: 'Not enough offline time to calculate earnings',
        offlineMs: cappedMs,
        breakdown: []
      });
    }

    const workingAssignments = await JobAssignment.find({
      userId: req.user._id,
      status: 'In Progress'
    }).populate('jobId');

    const breakdown = [];
    let totalMoney = 0;
    let totalXP = 0;

    for (const assignment of workingAssignments) {
      const job = assignment.jobId;
      if (!job) continue;

      const creature = await Creature.findById(assignment.creatureId);
      if (!creature) continue;

      const jobDurationMs = job.durationMinutes * 60 * 1000;
      const cyclesCompleted = Math.floor(cappedMs / jobDurationMs);

      if (cyclesCompleted <= 0) continue;

      let creatureMoney = 0;
      let creatureXP = 0;

      for (let i = 0; i < cyclesCompleted; i++) {
        creatureMoney += job.baseSalary;
        creatureXP += calculateXPReward(job, creature);
      }

      creature.totalEarnings += creatureMoney;
      creature.totalJobsCompleted += cyclesCompleted;
      creature.currentXP += creatureXP;

      while (creature.currentXP >= creature.totalXPNeeded && creature.level < 100) {
        creature.currentXP -= creature.totalXPNeeded;
        creature.level += 1;
        creature.totalXPNeeded = Math.round(creature.totalXPNeeded * 1.15);
      }

      creature.currentJob = null;
      await creature.save();

      assignment.status = 'Completed';
      assignment.moneyEarned = creatureMoney;
      assignment.xpEarned = creatureXP;
      await assignment.save();

      totalMoney += creatureMoney;
      totalXP += creatureXP;

      breakdown.push({
        creatureId: creature._id,
        jobName: job.name,
        cyclesCompleted,
        moneyEarned: creatureMoney,
        xpEarned: creatureXP
      });
    }

    user.totalMoney += totalMoney;
    user.totalXP += totalXP;
    user.lastLoginTime = now;
    await user.save();

    if (breakdown.length > 0) {
      try {
        await attemptUnlockMany(req.user._id, ['first_steps', 'wealthy', 'job_master']);
      } catch (achievementError) {
        console.error('Achievement check failed after offline earnings:', achievementError.message);
      }
    }

    res.status(200).json({
      offlineMs: cappedMs,
      offlineHoursApplied: Math.round((cappedMs / (60 * 60 * 1000)) * 100) / 100,
      totalMoneyEarned: totalMoney,
      totalXPEarned: totalXP,
      breakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating offline earnings', error: error.message });
  }
};

module.exports = { getServerTime, calculateOfflineEarnings };
