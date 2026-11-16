const User = require('../models/User');
const Creature = require('../models/Creature');
const JobAssignment = require('../models/JobAssignment');
const GameSave = require('../models/GameSave');

// @route GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// @route PUT /api/user/profile
// Only a small whitelist of fields are directly editable by the client.
// Money/XP/level should only ever change through gameplay logic (job
// completions, achievements, etc.), never a raw profile edit.
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['username', 'email'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No editable fields provided (username, email)' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username or email already in use' });
    }
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// @route GET /api/user/statistics
// Aggregates stats across all of a player's creatures, since totals like
// "money earned" and "jobs completed" live on individual Creature documents.
const getStatistics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const creatures = await Creature.find({ userId: req.user._id });

    const totalCreatureEarnings = creatures.reduce((sum, c) => sum + c.totalEarnings, 0);
    const totalJobsCompleted = creatures.reduce((sum, c) => sum + c.totalJobsCompleted, 0);
    const highestLevelCreature = creatures.reduce(
      (highest, c) => (c.level > (highest?.level || 0) ? c : highest),
      null
    );

    const activeJobCount = await JobAssignment.countDocuments({
      userId: req.user._id,
      status: 'In Progress'
    });

    res.status(200).json({
      statistics: {
        accountLevel: user.level,
        officeLevel: user.officeLevel,
        totalMoney: user.totalMoney,
        totalXP: user.totalXP,
        totalPlayTime: user.totalPlayTime,
        creatureCount: creatures.length,
        totalCreatureEarnings,
        totalJobsCompleted,
        activeJobCount,
        highestLevelCreature: highestLevelCreature
          ? { id: highestLevelCreature._id, level: highestLevelCreature.level }
          : null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// @route GET /api/user/cloud-save
const getCloudSave = async (req, res) => {
  try {
    const save = await GameSave.findOne({ userId: req.user._id });
    if (!save) {
      return res.status(404).json({ message: 'No cloud save found for this user yet' });
    }
    res.status(200).json({ save });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cloud save', error: error.message });
  }
};

// @route POST /api/user/cloud-save
// Upserts the player's full game state snapshot. The client is expected to
// send a gameState object shaped like the GameSave model's gameState field
// (userStats, creatures, jobAssignments, officeData, achievements) - this
// endpoint doesn't validate that shape beyond storing whatever is sent.
const saveCloudSave = async (req, res) => {
  try {
    const { gameState } = req.body;

    if (!gameState) {
      return res.status(400).json({ message: 'gameState is required' });
    }

    const save = await GameSave.findOneAndUpdate(
      { userId: req.user._id },
      { gameState, lastSaveTime: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ message: 'Cloud save updated', save });
  } catch (error) {
    res.status(500).json({ message: 'Error saving cloud save', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, getStatistics, getCloudSave, saveCloudSave };
