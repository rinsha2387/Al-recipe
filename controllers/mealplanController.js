const ejs = require('ejs');
const path = require('path');
const gemini = require('../services/gemini');
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');

exports.generate = async (req, res) => {
  try {
    const { diet, days } = req.body;
    const plan = await gemini.generateMealPlan(diet || 'vegetarian', days || 7);
    const html = await ejs.renderFile(
      path.join(__dirname, '..', 'views', 'partials', 'mealplanCards.ejs'),
      { plan, user: req.user || null }
    );
    res.json({ html, plan });
  } catch (err) {
    console.error('Meal plan generation error:', err.message);
    const isConnErr = err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED' || err.cause?.errno === -4078 || /ECONNREFUSED|fetch failed/i.test(err.message);
    const msg = isConnErr ? 'Ollama is not running. Start it with "ollama serve" or launch the Ollama app' : 'Failed to generate meal plan';
    res.status(500).json({ error: msg });
  }
};

exports.savePlan = async (req, res) => {
  try {
    const { title, diet, days, plan } = req.body;
    if (!plan || !Array.isArray(plan) || plan.length === 0) {
      return res.status(400).json({ error: 'No meal plan data provided' });
    }

    const defaultTitle = `${(diet || 'Weekly').charAt(0).toUpperCase() + (diet || 'Weekly').slice(1)} ${days || plan.length}-Day Meal Plan`;

    const mealPlan = await MealPlan.create({
      title: title || defaultTitle,
      diet: diet || 'any',
      days: days || plan.length,
      plan,
      savedBy: req.user._id
    });

    res.json({ saved: true, mealPlan });
  } catch (err) {
    console.error('Save meal plan error:', err);
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
};

exports.getSavedPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ savedBy: req.user._id }).sort('-createdAt').lean();
    res.json({ mealPlans });
  } catch (err) {
    console.error('Get saved meal plans error:', err);
    res.status(500).json({ error: 'Failed to retrieve saved meal plans' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    await MealPlan.findOneAndDelete({ _id: req.params.id, savedBy: req.user._id });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete meal plan error:', err);
    res.status(500).json({ error: 'Failed to delete meal plan' });
  }
};

exports.saveDish = async (req, res) => {
  try {
    const { title, ingredients, steps, image } = req.body;
    let existing = await Recipe.findOne({ title, savedBy: req.user._id });
    if (existing) return res.json({ saved: true });
    const recipe = await Recipe.create({
      title,
      ingredients: ingredients || [],
      steps: steps || [],
      image: image || '',
      savedBy: req.user._id
    });
    res.json({ saved: true, recipe });
  } catch (err) {
    console.error('Save dish error:', err);
    res.status(500).json({ error: 'Failed to save dish to recipes' });
  }
};
