const express = require('express');
const router = express.Router();
const {
  generate,
  savePlan,
  getSavedPlans,
  deletePlan,
  saveDish
} = require('../controllers/mealplanController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/generate', optionalAuth, generate);
router.post('/save', protect, savePlan);
router.get('/saved', protect, getSavedPlans);
router.delete('/save/:id', protect, deletePlan);
router.post('/save-dish', protect, saveDish);

module.exports = router;
