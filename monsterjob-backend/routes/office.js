const express = require('express');
const router = express.Router();
const {
  getOffice,
  getOfficeStatus,
  upgradeOffice,
  cancelUpgrade
} = require('../controllers/officeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getOffice);
router.get('/status', getOfficeStatus);
router.put('/upgrade', upgradeOffice);
router.delete('/upgrade', cancelUpgrade);

module.exports = router;
