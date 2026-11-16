const express = require('express');
const router = express.Router();
const {
  getAllSpecies,
  catchCreature,
  getMyCreatures,
  getCreatureById,
  updateCreature,
  releaseCreature
} = require('../controllers/creatureController');
const {
  getCreatureEquipment,
  equipItem,
  unequipItem
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/auth');

// All creature routes require the player to be logged in
router.use(protect);

router.get('/species', getAllSpecies);
router.post('/', catchCreature);
router.get('/', getMyCreatures);
router.get('/:id', getCreatureById);
router.put('/:id', updateCreature);
router.delete('/:id', releaseCreature);

router.get('/:id/equipment', getCreatureEquipment);
router.put('/:id/equipment/:slot', equipItem);
router.delete('/:id/equipment/:slot', unequipItem);

module.exports = router;
