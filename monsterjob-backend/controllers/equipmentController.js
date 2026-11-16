const Equipment = require('../models/Equipment');
const Creature = require('../models/Creature');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

const VALID_SLOTS = ['head', 'body', 'accessory'];
const SLOT_TO_TYPE = { head: 'Head', body: 'Body', accessory: 'Accessory' };

// @route GET /api/equipment
// Get the full equipment catalog, optionally filtered by type or rarity
const getAllEquipment = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.rarity) filter.rarity = req.query.rarity;

    const equipment = await Equipment.find(filter).sort({ rarity: 1, name: 1 });
    res.status(200).json({ equipment });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching equipment', error: error.message });
  }
};

// @route GET /api/equipment/inventory
// Get the player's owned (available, unequipped) equipment with quantities
const getMyInventory = async (req, res) => {
  try {
    const items = await Inventory.find({ userId: req.user._id, quantity: { $gt: 0 } }).populate(
      'equipmentId'
    );
    res.status(200).json({
      inventory: items.map((i) => ({ equipment: i.equipmentId, quantity: i.quantity }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
};

// @route POST /api/equipment/purchase/:id
// Deducts cost from the player's money AND adds one copy to their Inventory.
// This is what makes equipping actually require ownership now.
const purchaseEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const user = await User.findById(req.user._id);

    if (user.totalMoney < equipment.cost) {
      return res.status(400).json({ message: 'Not enough money to purchase this equipment' });
    }

    user.totalMoney -= equipment.cost;
    await user.save();

    await Inventory.findOneAndUpdate(
      { userId: req.user._id, equipmentId: equipment._id },
      { $inc: { quantity: 1 } },
      { upsert: true }
    );

    res.status(200).json({ message: 'Equipment purchased', equipment, remainingMoney: user.totalMoney });
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing equipment', error: error.message });
  }
};

// @route GET /api/creatures/:id/equipment
// Get the equipped items for a specific creature
const getCreatureEquipment = async (req, res) => {
  try {
    const creature = await Creature.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('equipment.head')
      .populate('equipment.body')
      .populate('equipment.accessory');

    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    res.status(200).json({ equipment: creature.equipment });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching creature equipment', error: error.message });
  }
};

// @route PUT /api/creatures/:id/equipment/:slot
// Equip an item into a slot (head, body, accessory). Body: { equipmentId }
// Now requires actual ownership via Inventory - equipping consumes one
// available copy, and if something was already in that slot, its copy is
// returned to inventory (swapping gear doesn't destroy the old item).
const equipItem = async (req, res) => {
  try {
    const { slot } = req.params;
    const { equipmentId } = req.body;

    if (!VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ message: `Slot must be one of: ${VALID_SLOTS.join(', ')}` });
    }
    if (!equipmentId) {
      return res.status(400).json({ message: 'equipmentId is required' });
    }

    const creature = await Creature.findOne({ _id: req.params.id, userId: req.user._id });
    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (equipment.type !== SLOT_TO_TYPE[slot]) {
      return res.status(400).json({
        message: `This equipment is type "${equipment.type}" and can't go in the "${slot}" slot`
      });
    }

    if (creature.level < equipment.level) {
      return res.status(400).json({
        message: `Creature must be at least level ${equipment.level} to equip this item`
      });
    }

    const inventoryEntry = await Inventory.findOne({ userId: req.user._id, equipmentId: equipment._id });
    if (!inventoryEntry || inventoryEntry.quantity < 1) {
      return res.status(400).json({
        message: `You don't own a ${equipment.name} - purchase it from the shop first`
      });
    }

    const previousItemId = creature.equipment[slot];

    // Consume one copy of the new item from inventory
    inventoryEntry.quantity -= 1;
    await inventoryEntry.save();

    // Return the previously-equipped item (if any, and if different from the
    // new one) to inventory - swapping gear doesn't destroy the old item
    if (previousItemId && String(previousItemId) !== String(equipment._id)) {
      await Inventory.findOneAndUpdate(
        { userId: req.user._id, equipmentId: previousItemId },
        { $inc: { quantity: 1 } },
        { upsert: true }
      );
    }

    creature.equipment[slot] = equipment._id;
    await creature.save();

    const updated = await Creature.findById(creature._id)
      .populate('equipment.head')
      .populate('equipment.body')
      .populate('equipment.accessory');

    res.status(200).json({ equipment: updated.equipment });
  } catch (error) {
    res.status(500).json({ message: 'Error equipping item', error: error.message });
  }
};

// @route DELETE /api/creatures/:id/equipment/:slot
// Unequip whatever is in a slot - returns it to inventory (it's not destroyed)
const unequipItem = async (req, res) => {
  try {
    const { slot } = req.params;

    if (!VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ message: `Slot must be one of: ${VALID_SLOTS.join(', ')}` });
    }

    const creature = await Creature.findOne({ _id: req.params.id, userId: req.user._id });
    if (!creature) {
      return res.status(404).json({ message: 'Creature not found' });
    }

    const currentItemId = creature.equipment[slot];
    if (!currentItemId) {
      return res.status(400).json({ message: `Nothing is equipped in the ${slot} slot` });
    }

    await Inventory.findOneAndUpdate(
      { userId: req.user._id, equipmentId: currentItemId },
      { $inc: { quantity: 1 } },
      { upsert: true }
    );

    creature.equipment[slot] = null;
    await creature.save();

    res.status(200).json({ message: `Unequipped ${slot}`, equipment: creature.equipment });
  } catch (error) {
    res.status(500).json({ message: 'Error unequipping item', error: error.message });
  }
};

module.exports = {
  getAllEquipment,
  getMyInventory,
  purchaseEquipment,
  getCreatureEquipment,
  equipItem,
  unequipItem
};
