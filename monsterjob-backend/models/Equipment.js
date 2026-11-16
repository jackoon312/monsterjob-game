const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['Head', 'Body', 'Accessory'] },
    rarity: {
      type: String,
      required: true,
      enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
    },
    statBonus: {
      strength: { type: Number, default: 0 },
      intelligence: { type: Number, default: 0 },
      stamina: { type: Number, default: 0 },
      charisma: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      health: { type: Number, default: 0 }
    },
    cost: { type: Number, required: true },
    icon: { type: String },
    obtainMethod: {
      type: String,
      enum: ['Shop', 'Achievement', 'Craft', 'Rare Find'],
      default: 'Shop'
    },
    level: { type: Number, default: 1 },
    description: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
