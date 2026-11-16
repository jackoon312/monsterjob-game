const mongoose = require('mongoose');

const gameSaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lastSaveTime: { type: Date, default: Date.now },
  gameState: {
    userStats: { type: mongoose.Schema.Types.Mixed, default: {} },
    creatures: { type: [mongoose.Schema.Types.Mixed], default: [] },
    jobAssignments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    officeData: { type: mongoose.Schema.Types.Mixed, default: {} },
    achievements: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  cloudSyncEnabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('GameSave', gameSaveSchema);
