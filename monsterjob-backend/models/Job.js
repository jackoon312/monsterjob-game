const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Labor', 'Creative', 'Service', 'Combat', 'Craft']
    },
    requiredStats: {
      minimumLevel: { type: Number, default: 1 },
      minimumStrength: { type: Number, default: 0 },
      minimumIntelligence: { type: Number, default: 0 },
      minimumStamina: { type: Number, default: 0 },
      minimumCharisma: { type: Number, default: 0 },
      minimumSpeed: { type: Number, default: 0 }
    },
    energyCost: { type: Number, required: true, min: 1, max: 50 },
    baseSalary: { type: Number, required: true },
    baseXPReward: { type: Number, required: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 60 },
    difficulty: {
      type: String,
      enum: ['Easy', 'Normal', 'Hard', 'Very Hard'],
      default: 'Easy'
    },
    icon: { type: String },
    riskFactor: { type: Number, default: 0, min: 0, max: 100 },
    statBonus: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Job', jobSchema);
