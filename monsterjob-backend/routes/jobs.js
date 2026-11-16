const express = require('express');
const router = express.Router();
const {
  getAllJobs,
  getJobById,
  getRecommendations,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllJobs);
router.get('/recommendations/:creatureId', getRecommendations);
router.get('/:id', getJobById);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;
