const User = require('../models/User');
const { generateToken } = require('../middleware/authMiddleware');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.render('signup', { user: null, error: 'Email already registered' });
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('signup', { user: null, error: 'Something went wrong' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.render('login', { user: null, error: 'Invalid email or password' });
    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect(user.role === 'admin' ? '/admin' : '/');
  } catch (err) {
    console.error(err);
    res.render('login', { user: null, error: 'Something went wrong' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};
