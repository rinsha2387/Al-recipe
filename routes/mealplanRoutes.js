const express = require('express');
const router = express.Router();
const { generate } = require('../controllers/mealplanController');

router.post('/generate', generate);

module.exports = router;
