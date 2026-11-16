const mongoose = require('mongoose');

const creatureSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    creatureSpeciesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatureSpecies',
      required: true
    },
    nickname: { type: String, trim: true },
    level: { type: Number, default: 1, min: 1, max: 100 },
    currentXP: { type: Number, default: 0 },
    totalXPNeeded: { type: Number, default: 100 },
    stats: {
      health: { type: Number, required: true },
      strength: { type: Number, required: true },
      intelligence: { type: Number, required: true },
      stamina: { type: Number, required: true },
      charisma: { type: Number, required: true },
      speed: { type: Number, required: true }
    },
    currentEnergy: { type: Number, default: 100 },
    maxEnergy: { type: Number, default: 100 },
    currentJob: { type: mongoose.Schema.Types.ObjectId, ref: 'JobAssignment', default: null },
    equipment: {
      head: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', default: null },
      body: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', default: null },
      accessory: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', default: null }
    },
    totalEarnings: { type: Number, default: 0 },
    totalJobsCompleted: { type: Number, default: 0 },
    abilities: { type: [String], default: [] },
    isFavorite: { type: Boolean, default: false },
    catchTime: { type: Date, default: Date.now }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

module.exports = mongoose.model('Creature', creatureSchema);
