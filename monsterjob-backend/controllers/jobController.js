const Job = require('../models/Job');
const Creature = require('../models/Creature');
const { calculateEffectiveStats } = require('../utils/effectiveStats');

// @route GET /api/jobs
// Get all available jobs, optionally filtered by category or difficulty
const getAllJobs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const jobs = await Job.find(filter).sort({ category: 1, name: 1 });
    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
};

// @route GET /api/jobs/:id
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
};

// @route GET /api/jobs/recommendations/:creatureId
// Suggests jobs a specific creature currently qualifies for, ranked by how well
// its stats exceed the job's minimum requirements (highest total margin first).
const getRecommendations = async (req, res) => {
  try {
    const creature = await Creature.findOne({
      _id: req.params.creatureId,
      userId: req.user._id
    })
      .populate('equipment.head')
      .populate('equipment.body')
      .populate('equipment.accessory');

    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    const effectiveStats = calculateEffectiveStats(creature);

    const allJobs = await Job.find();

    const qualifyingJobs = allJobs
      .filter((job) => {
        const reqStats = job.requiredStats;
        return (
          creature.level >= reqStats.minimumLevel &&
          effectiveStats.strength >= reqStats.minimumStrength &&
          effectiveStats.intelligence >= reqStats.minimumIntelligence &&
          effectiveStats.stamina >= reqStats.minimumStamina &&
          effectiveStats.charisma >= reqStats.minimumCharisma &&
          effectiveStats.speed >= reqStats.minimumSpeed &&
          creature.currentEnergy >= job.energyCost
        );
      })
      .map((job) => {
        const reqStats = job.requiredStats;
        const margin =
          (effectiveStats.strength - reqStats.minimumStrength) +
          (effectiveStats.intelligence - reqStats.minimumIntelligence) +
          (effectiveStats.stamina - reqStats.minimumStamina) +
          (effectiveStats.charisma - reqStats.minimumCharisma) +
          (effectiveStats.speed - reqStats.minimumSpeed);
        return { job, matchScore: margin };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({ recommendations: qualifyingJobs });
  } catch (error) {
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
};

// @route POST /api/jobs
// Create a new job definition (admin/dev use - populating the job catalog)
const createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
};

// @route PUT /api/jobs/:id
const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: 'Error updating job', error: error.message });
  }
};

// @route DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ message: 'Job deleted', job });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  getRecommendations,
  createJob,
  updateJob,
  deleteJob
};
