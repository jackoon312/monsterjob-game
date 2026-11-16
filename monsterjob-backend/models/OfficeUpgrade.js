const mongoose = require('mongoose');

const officeUpgradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  tier: { type: Number, default: 1, min: 1, max: 20 },
  creatureCapacity: { type: Number, default: 1 },
  jobSlots: { type: Number, default: 1 },
  equipmentSlots: { type: Number, default: 3 },
  unlockedFeatures: { type: [String], default: [] },
  upgradeProgress: { type: Number, default: 0, min: 0, max: 100 },
  money: { type: Number, default: 0 },
  timeRequiredHours: { type: Number, default: 1 },
  upgradedAt: { type: Date, default: Date.now },
  upgradeInProgress: { type: Boolean, default: false },
  upgradeStartTime: { type: Date, default: null },
  upgradeEndTime: { type: Date, default: null },
  upgradeTargetTier: { type: Number, default: null }
});

module.exports = mongoose.model('OfficeUpgrade', officeUpgradeSchema);
