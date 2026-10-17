const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  meal: { type: String, default: '' },
  dish: { type: String, required: true },
  ingredients: [String],
  steps: [String],
  image: { type: String, default: '' }
}, { _id: false });

const dayPlanSchema = new mongoose.Schema({
  day: { type: String, required: true },
  meals: [mealItemSchema]
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  title: { type: String, default: 'Weekly Meal Plan' },
  diet: { type: String, default: 'any' },
  days: { type: Number, default: 7 },
  plan: [dayPlanSchema],
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
