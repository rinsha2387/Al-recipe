const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) { res.clearCookie('token'); return res.redirect('/login'); }
    req.user = user;
    res.locals.user = user;
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/login');
  }
};

exports.optionalAuth = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      res.locals.user = req.user || null;
    } catch { req.user = null; res.locals.user = null; }
  } else { req.user = null; res.locals.user = null; }
  next();
};

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
