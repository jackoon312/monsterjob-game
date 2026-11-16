const mongoose = require('mongoose');

const statBlock = {
  health: { type: Number, required: true },
  strength: { type: Number, required: true },
  intelligence: { type: Number, required: true },
  stamina: { type: Number, required: true },
  charisma: { type: Number, required: true },
  speed: { type: Number, required: true }
};

const creatureSpeciesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['Fire', 'Water', 'Nature', 'Electric', 'Rock', 'Metal', 'Psychic', 'Dark']
    },
    rarity: {
      type: String,
      required: true,
      enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
    },
    baseStats: { type: statBlock, required: true },
    statGrowthPerLevel: { type: statBlock, required: true },
    spriteAssetPath: { type: String, required: true },
    animationFrames: { type: Number, default: 6 },
    personality: { type: String },
    evolution: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatureSpecies', default: null },
    obtainMethod: {
      type: String,
      enum: ['Catch', 'Trade', 'Achievement', 'Event'],
      default: 'Catch'
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('CreatureSpecies', creatureSpeciesSchema);
