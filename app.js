const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const mealplanRoutes = require('./routes/mealplanRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { optionalAuth } = require('./middleware/authMiddleware');

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/mealplan', mealplanRoutes);
app.use('/admin', adminRoutes);

app.get('/', optionalAuth, (req, res) => {
  res.render('index', { user: req.user || null, activePage: 'home' });
});

app.get('/login', (req, res) => {
  res.render('login', { user: null, error: null });
});

app.get('/signup', (req, res) => {
  res.render('signup', { user: null, error: null });
});

app.get('/mealplan', optionalAuth, (req, res) => {
  res.render('mealplan', { user: req.user || null, activePage: 'mealplan' });
});

app.get('/saved', optionalAuth, (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.redirect('/api/recipes/saved');
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
