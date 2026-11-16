const express = require('express');
const router = express.Router();
const {
  getAllAchievements,
  getMyAchievements,
  checkAchievement
} = require('../controllers/achievementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/all', getAllAchievements);
router.get('/', getMyAchievements);
router.post('/:achievementId/check', checkAchievement);

module.exports = router;
