const JobAssignment = require('../models/JobAssignment');
const Creature = require('../models/Creature');
const Job = require('../models/Job');
const User = require('../models/User');
const { calculateEffectiveStats } = require('../utils/effectiveStats');
const { getOrCreateOffice } = require('../utils/officeHelpers');
const { attemptUnlockMany } = require('./achievementController');

// Shared XP formula from the spec:
// XP = Job.baseXPReward * difficultyMultiplier * (100 - creature.level) / 100
const DIFFICULTY_MULTIPLIER = {
  Easy: 1,
  Normal: 1.25,
  Hard: 1.5,
  'Very Hard': 2
};

const calculateXPReward = (job, creature) => {
  const multiplier = DIFFICULTY_MULTIPLIER[job.difficulty] || 1;
  const levelFactor = Math.max(100 - creature.level, 1) / 100;
  return Math.round(job.baseXPReward * multiplier * levelFactor);
};

// @route POST /api/assignments
// Assigns a creature to a job: validates eligibility, deducts energy,
// creates the assignment, and marks the creature as busy.
const createAssignment = async (req, res) => {
  try {
    const { creatureId, jobId } = req.body;

    if (!creatureId || !jobId) {
      return res.status(400).json({ message: 'creatureId and jobId are required' });
    }

    const creature = await Creature.findOne({ _id: creatureId, userId: req.user._id })
      .populate('equipment.head')
      .populate('equipment.body')
      .populate('equipment.accessory');
    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    if (creature.currentJob) {
      return res.status(409).json({ message: 'Creature is already working a job' });
    }

    const office = await getOrCreateOffice(req.user._id);
    const activeAssignmentCount = await JobAssignment.countDocuments({
      userId: req.user._id,
      status: 'In Progress'
    });

    if (activeAssignmentCount >= office.jobSlots) {
      return res.status(400).json({
        message: `All job slots are full (${activeAssignmentCount}/${office.jobSlots}). Upgrade your office to unlock more.`
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const effectiveStats = calculateEffectiveStats(creature);
    const reqStats = job.requiredStats;
    const qualifies =
      creature.level >= reqStats.minimumLevel &&
      effectiveStats.strength >= reqStats.minimumStrength &&
      effectiveStats.intelligence >= reqStats.minimumIntelligence &&
      effectiveStats.stamina >= reqStats.minimumStamina &&
      effectiveStats.charisma >= reqStats.minimumCharisma &&
      effectiveStats.speed >= reqStats.minimumSpeed;

    if (!qualifies) {
      return res.status(400).json({ message: 'Creature does not meet the stat requirements for this job' });
    }

    if (creature.currentEnergy < job.energyCost) {
      return res.status(400).json({ message: 'Creature does not have enough energy for this job' });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + job.durationMinutes * 60 * 1000);

    const assignment = await JobAssignment.create({
      userId: req.user._id,
      creatureId: creature._id,
      jobId: job._id,
      startTime,
      endTime,
      status: 'In Progress'
    });

    creature.currentEnergy -= job.energyCost;
    creature.currentJob = assignment._id;
    await creature.save();

    res.status(201).json({ assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

// @route GET /api/assignments
// Get all of the player's active (In Progress) assignments
const getActiveAssignments = async (req, res) => {
  try {
    const assignments = await JobAssignment.find({
      userId: req.user._id,
      status: 'In Progress'
    })
      .populate('creatureId')
      .populate('jobId');

    res.status(200).json({ assignments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// @route PUT /api/assignments/:id
// Checks whether the job's duration has elapsed. If so, completes it:
// applies risk factor, pays out money/XP (or records failure), frees the creature.
// This is what your frontend should poll/call once endTime has passed.
const checkAndCompleteAssignment = async (req, res) => {
  try {
    const assignment = await JobAssignment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.status !== 'In Progress') {
      return res.status(200).json({ assignment, message: 'Assignment already resolved' });
    }

    if (new Date() < assignment.endTime) {
      return res.status(400).json({
        message: 'Job is not finished yet',
        secondsRemaining: Math.ceil((assignment.endTime - new Date()) / 1000)
      });
    }

    const [creature, job] = await Promise.all([
      Creature.findById(assignment.creatureId),
      Job.findById(assignment.jobId)
    ]);

    const didFail = Math.random() * 100 < job.riskFactor;

    if (didFail) {
      assignment.status = 'Failed';
      assignment.failureReason = 'Random risk check failed';
      assignment.moneyEarned = 0;
      assignment.xpEarned = 0;
    } else {
      const xpEarned = calculateXPReward(job, creature);
      assignment.status = 'Completed';
      assignment.moneyEarned = job.baseSalary;
      assignment.xpEarned = xpEarned;

      creature.totalEarnings += job.baseSalary;
      creature.totalJobsCompleted += 1;
      creature.currentXP += xpEarned;

      // Credit the player's actual spendable balance and account XP too -
      // creature.totalEarnings/totalXP above are just stat history, this is
      // what equipment purchases and office upgrades actually check against.
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalMoney: job.baseSalary, totalXP: xpEarned }
      });

      // Simple level-up loop: keep leveling while XP exceeds the threshold
      while (creature.currentXP >= creature.totalXPNeeded && creature.level < 100) {
        creature.currentXP -= creature.totalXPNeeded;
        creature.level += 1;
        creature.totalXPNeeded = Math.round(creature.totalXPNeeded * 1.15);
      }
    }

    creature.currentJob = null;
    await creature.save();
    await assignment.save();

    if (!didFail) {
      try {
        await attemptUnlockMany(req.user._id, ['first_steps', 'wealthy', 'job_master']);
      } catch (achievementError) {
        console.error('Achievement check failed after job completion:', achievementError.message);
      }
    }

    res.status(200).json({ assignment, creature });
  } catch (error) {
    res.status(500).json({ message: 'Error completing assignment', error: error.message });
  }
};

// @route DELETE /api/assignments/:id
// Cancels an in-progress job early. No payout, energy is NOT refunded (matches
// the spec's intent that jobs have real commitment/risk).
const cancelAssignment = async (req, res) => {
  try {
    const assignment = await JobAssignment.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.status !== 'In Progress') {
      return res.status(400).json({ message: 'Only in-progress assignments can be cancelled' });
    }

    assignment.status = 'Failed';
    assignment.failureReason = 'Cancelled by player';
    await assignment.save();

    await Creature.findByIdAndUpdate(assignment.creatureId, { currentJob: null });

    res.status(200).json({ message: 'Assignment cancelled', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling assignment', error: error.message });
  }
};

module.exports = {
  createAssignment,
  getActiveAssignments,
  checkAndCompleteAssignment,
  cancelAssignment
};
