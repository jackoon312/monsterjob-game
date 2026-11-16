const express = require('express');
const router = express.Router();
const { getServerTime, calculateOfflineEarnings } = require('../controllers/offlineController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/time', getServerTime);
router.post('/offline-earnings', calculateOfflineEarnings);

module.exports = router;
