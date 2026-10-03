const User = require('../models/User');
const Recipe = require('../models/Recipe');

exports.getDashboard = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalRecipes = await Recipe.countDocuments();
  res.render('admin/dashboard', {
    user: req.user,
    activeAdmin: 'dashboard',
    totalUsers,
    totalRecipes,
  });
};

exports.getUsers = async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.render('admin/users', { user: req.user, activeAdmin: 'users', users });
};

exports.deleteUser = async (req, res) => {
  await Recipe.deleteMany({ savedBy: req.params.id });
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin/users');
};

exports.getAllRecipes = async (req, res) => {
  const recipes = await Recipe.find()
    .populate('savedBy', 'name email')
    .sort('-createdAt');
  res.render('admin/recipes', { user: req.user, activeAdmin: 'recipes', recipes });
};

exports.deleteRecipe = async (req, res) => {
  await Recipe.findByIdAndDelete(req.params.id);
  res.redirect('/admin/recipes');
};