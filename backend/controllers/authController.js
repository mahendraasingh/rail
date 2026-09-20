const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getDBStatus } = require('../config/db');

// In-Memory fallback store for environments without MongoDB
const inMemoryUsers = [
  {
    _id: 'demo_user_1',
    name: 'Mahendra Sharma',
    email: 'demo@railtogether.app',
    phone: '+91 9876543210',
    password: '$2a$10$demohashedpasswordforhackathontesting',
  },
];

const generateToken = (id, name, email) => {
  return jwt.sign(
    { id, name, email },
    process.env.JWT_SECRET || 'railtogether_hackathon_super_secure_jwt_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (getDBStatus()) {
    try {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        phone: phone || '',
        password,
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: generateToken(user._id, user.name, user.email),
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Fallback in-memory registration
  const userExists = inMemoryUsers.find((u) => u.email === normalizedEmail);
  if (userExists) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const newUser = {
    _id: 'user_' + Date.now(),
    name,
    email: normalizedEmail,
    phone: phone || '',
    password,
  };
  inMemoryUsers.push(newUser);

  return res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    token: generateToken(newUser._id, newUser.name, newUser.email),
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (getDBStatus()) {
    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token: generateToken(user._id, user.name, user.email),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Fallback in-memory login
  const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
  if (user) {
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id, user.name, user.email),
    });
  }

  // Quick fallback demo user creation if not found during demo
  const fallbackUser = {
    _id: 'demo_user_1',
    name: 'Mahendra Sharma',
    email: normalizedEmail,
    phone: '+91 9876543210',
  };
  return res.json({
    _id: fallbackUser._id,
    name: fallbackUser.name,
    email: fallbackUser.email,
    phone: fallbackUser.phone,
    token: generateToken(fallbackUser._id, fallbackUser.name, fallbackUser.email),
  });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  if (req.user) {
    return res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || '',
    });
  }
  return res.status(404).json({ message: 'User not found' });
};

// @desc    Instant Demo login
// @route   POST /api/auth/demo
// @access  Public
const demoLogin = async (req, res) => {
  const demoUser = {
    _id: 'demo_user_1',
    name: 'Mahendra (Travelling Group Leader)',
    email: 'demo.passenger@railtogether.app',
    phone: '+91 9876543210',
  };
  return res.json({
    _id: demoUser._id,
    name: demoUser.name,
    email: demoUser.email,
    phone: demoUser.phone,
    token: generateToken(demoUser._id, demoUser.name, demoUser.email),
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  demoLogin,
};
