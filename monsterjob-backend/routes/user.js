const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getStatistics,
  getCloudSave,
  saveCloudSave
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/statistics', getStatistics);
router.get('/cloud-save', getCloudSave);
router.post('/cloud-save', saveCloudSave);

module.exports = router;
