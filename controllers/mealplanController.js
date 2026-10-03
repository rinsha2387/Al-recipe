const ejs = require('ejs');
const path = require('path');
const gemini = require('../services/gemini');

exports.generate = async (req, res) => {
  try {
    const { diet, days } = req.body;
    const plan = await gemini.generateMealPlan(diet || 'vegetarian', days || 7);
    const html = await ejs.renderFile(
      path.join(__dirname, '..', 'views', 'partials', 'mealplanCards.ejs'),
      { plan }
    );
    res.json({ html });
  } catch (err) {
    console.error(err);
    const isConnErr = err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED' || err.cause?.errno === -4078 || /ECONNREFUSED|fetch failed/i.test(err.message);
    const msg = isConnErr ? 'Ollama is not running. Start it with "ollama serve" or launch the Ollama app' : 'Failed to generate meal plan';
    res.status(500).json({ error: msg });
  }
};
