const express = require('express');
const router = express.Router();
const { getAllEquipment, getMyInventory, purchaseEquipment } = require('../controllers/equipmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllEquipment);
router.get('/inventory', getMyInventory);
router.post('/purchase/:id', purchaseEquipment);

module.exports = router;
