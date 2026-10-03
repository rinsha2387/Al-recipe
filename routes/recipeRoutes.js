const express = require('express');
const router = express.Router();
const { suggest, saveRecipe, getSaved, unsaveRecipe } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/suggest', suggest);
router.post('/save', protect, saveRecipe);
router.get('/saved', protect, getSaved);
router.delete('/save/:id', protect, unsaveRecipe);

module.exports = router;
