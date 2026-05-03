const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'taskflow_secret_key', { expiresIn: '7d' });

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered.' });
    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, globalRole: user.globalRole } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' });
    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, globalRole: user.globalRole } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
