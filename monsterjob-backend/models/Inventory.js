const mongoose = require('mongoose');

// Tracks owned-but-not-currently-equipped quantity of each equipment item per
// player. "quantity" represents AVAILABLE copies only - equipping an item
// decrements it, unequipping increments it back. This is what makes
// purchasing actually mean something: without this, any valid equipment _id
// could be equipped regardless of whether it was ever bought.
const inventorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    quantity: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

// One inventory row per (user, equipment item) pair - purchases increment
// the existing row instead of creating duplicates.
inventorySchema.index({ userId: 1, equipmentId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
