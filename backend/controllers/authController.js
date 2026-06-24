const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.registerUser = async (req, res) => {
  const { name, email, password, role, trainerCode } = req.body;
  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (role === 'trainer') {
      if (trainerCode !== '9989') {
        return res.status(400).json({ message: 'Invalid trainer sign up code' });
      }
      const trainerExists = await Trainer.findOne({ email });
      if (trainerExists) {
        return res.status(400).json({ message: 'Trainer already exists with this email' });
      }
      const trainer = await Trainer.create({ name, email, password });
      return res.status(201).json({
        _id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        token: generateToken(trainer._id)
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, role, isVerified: true });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

exports.authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    let account = await User.findOne({ email });
    if (!account) account = await Trainer.findOne({ email });
    if (!account) account = await Admin.findOne({ email });

    if (!account || !(await bcrypt.compare(password, account.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (account.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by admin' });
    }

    if (account.role === 'trainer' && !account.isVerified) {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }

    res.json({ _id: account._id, name: account.name, email: account.email, role: account.role, token: generateToken(account._id) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};