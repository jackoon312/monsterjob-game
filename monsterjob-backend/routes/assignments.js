const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getActiveAssignments,
  checkAndCompleteAssignment,
  cancelAssignment
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createAssignment);
router.get('/', getActiveAssignments);
router.put('/:id', checkAndCompleteAssignment);
router.delete('/:id', cancelAssignment);

module.exports = router;
