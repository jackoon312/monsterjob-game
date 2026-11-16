const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  achievementId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  unlockedAt: { type: Date, default: Date.now },
  reward: {
    money: { type: Number, default: 0 },
    cosmetics: { type: [String], default: [] }
  }
});

// A user can only unlock a specific achievement once
achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
