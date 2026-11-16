const Creature = require('../models/Creature');
const CreatureSpecies = require('../models/CreatureSpecies');
const { getOrCreateOffice } = require('../utils/officeHelpers');
const { attemptUnlockMany } = require('./achievementController');

// @route GET /api/creatures/species
// Get all creature species (the static catalog of all 24 creatures)
const getAllSpecies = async (req, res) => {
  try {
    const species = await CreatureSpecies.find().sort({ rarity: 1, name: 1 });
    res.status(200).json({ species });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching species', error: error.message });
  }
};

// @route POST /api/creatures
// "Catch" a new creature - creates a Creature instance from a species for this user
const catchCreature = async (req, res) => {
  try {
    const { creatureSpeciesId, nickname } = req.body;

    if (!creatureSpeciesId) {
      return res.status(400).json({ message: 'creatureSpeciesId is required' });
    }

    const species = await CreatureSpecies.findById(creatureSpeciesId);
    if (!species) {
      return res.status(404).json({ message: 'Creature species not found' });
    }

    const office = await getOrCreateOffice(req.user._id);
    const currentCreatureCount = await Creature.countDocuments({ userId: req.user._id });

    if (currentCreatureCount >= office.creatureCapacity) {
      return res.status(400).json({
        message: `Office is at creature capacity (${currentCreatureCount}/${office.creatureCapacity}). Upgrade your office or release a creature first.`
      });
    }

    const newCreature = await Creature.create({
      userId: req.user._id,
      creatureSpeciesId: species._id,
      nickname: nickname || species.name,
      stats: { ...species.baseStats },
      totalXPNeeded: 100
    });

    // Fire-and-forget style, but awaited so unlocks are reflected immediately -
    // failures here shouldn't block the catch itself, so errors are swallowed.
    try {
      await attemptUnlockMany(req.user._id, ['first_catch', 'team_builder', 'legendary_hunter']);
    } catch (achievementError) {
      console.error('Achievement check failed after catchCreature:', achievementError.message);
    }

    res.status(201).json({ creature: newCreature });
  } catch (error) {
    res.status(500).json({ message: 'Error catching creature', error: error.message });
  }
};

// @route GET /api/creatures
// Get all creatures owned by the logged-in player
const getMyCreatures = async (req, res) => {
  try {
    const creatures = await Creature.find({ userId: req.user._id })
      .populate('creatureSpeciesId')
      .populate('equipment.head')
      .populate('equipment.body')
      .populate('equipment.accessory')
      .sort({ catchTime: -1 });

    res.status(200).json({ creatures });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching creatures', error: error.message });
  }
};

// @route GET /api/creatures/:id
// Get a single creature owned by the logged-in player
const getCreatureById = async (req, res) => {
  try {
    const creature = await Creature.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('creatureSpeciesId');

    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    res.status(200).json({ creature });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching creature', error: error.message });
  }
};

// @route PUT /api/creatures/:id
// Update a creature (rename, toggle favorite, level up, etc.)
// Whitelisted fields only - stats/XP progression should go through dedicated
// job-completion logic later, not be editable directly by the client.
const updateCreature = async (req, res) => {
  try {
    const allowedFields = ['nickname', 'isFavorite'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const creature = await Creature.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('creatureSpeciesId');

    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    res.status(200).json({ creature });
  } catch (error) {
    res.status(500).json({ message: 'Error updating creature', error: error.message });
  }
};

// @route DELETE /api/creatures/:id
// Release a creature
const releaseCreature = async (req, res) => {
  try {
    const creature = await Creature.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    if (creature.currentJob) {
      return res.status(400).json({
        message: 'Cannot release a creature that is currently working a job. Cancel or complete its assignment first.'
      });
    }

    await creature.deleteOne();

    res.status(200).json({ message: 'Creature released', creature });
  } catch (error) {
    res.status(500).json({ message: 'Error releasing creature', error: error.message });
  }
};

module.exports = {
  getAllSpecies,
  catchCreature,
  getMyCreatures,
  getCreatureById,
  updateCreature,
  releaseCreature
};
