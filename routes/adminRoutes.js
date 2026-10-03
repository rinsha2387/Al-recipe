const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  getDashboard,
  getUsers,
  deleteUser,
  getAllRecipes,
  deleteRecipe,
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/', getDashboard);
router.get('/users', getUsers);
router.post('/users/:id/delete', deleteUser);
router.get('/recipes', getAllRecipes);
router.post('/recipes/:id/delete', deleteRecipe);

module.exports = router;