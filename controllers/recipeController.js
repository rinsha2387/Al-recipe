const gemini = require('../services/gemini');
const Recipe = require('../models/Recipe');

exports.suggest = async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !ingredients.length)
      return res.status(400).json({ error: 'Please provide at least one ingredient' });
    const recipes = await gemini.suggestRecipes(ingredients);
    res.json({ recipes });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    const isConnErr = err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED' || err.cause?.errno === -4078 || /ECONNREFUSED|fetch failed/i.test(err.message);
    const msg = isConnErr ? 'Ollama is not running. Start it with "ollama serve" or launch the Ollama app' : 'Failed to generate recipes';
    res.status(500).json({ error: msg });
  }
};

exports.saveRecipe = async (req, res) => {
  try {
    const { title, ingredients, steps } = req.body;
    let recipe = await Recipe.findOne({ title, savedBy: req.user._id });
    if (recipe) return res.json({ saved: true });
    recipe = await Recipe.create({ title, ingredients, steps, savedBy: req.user._id });
    res.json({ saved: true, recipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save recipe' });
  }
};

exports.getSaved = async (req, res) => {
  try {
    const recipes = await Recipe.find({ savedBy: req.user._id }).lean();
    res.render('saved', { user: req.user, recipes, activePage: 'saved' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.unsaveRecipe = async (req, res) => {
  try {
    await Recipe.findOneAndDelete({ _id: req.params.id, savedBy: req.user._id });
    res.json({ saved: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unsave recipe' });
  }
};
