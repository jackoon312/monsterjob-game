const mongoose = require('mongoose');

const jobAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  creatureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creature', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date, required: true },
  moneyEarned: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Failed'],
    default: 'In Progress'
  },
  failureReason: { type: String, default: null }
});

module.exports = mongoose.model('JobAssignment', jobAssignmentSchema);
