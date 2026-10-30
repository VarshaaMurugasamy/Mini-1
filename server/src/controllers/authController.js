const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new customer account
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      department: department || 'General',
      role: 'customer' // default registration is customer
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT token
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.'
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current authenticated user info
// @access  Private
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile.'
    });
  }
};

// @route   POST /api/auth/seed
// @desc    Seed initial demo users for instant testing (Admin, Engineer, Customer)
// @access  Public (Development aid)
exports.seedUsers = async (req, res) => {
  try {
    const seedData = [
      {
        name: 'Alex Johnson (Admin)',
        email: 'admin@helpdesk.com',
        password: 'admin123',
        role: 'admin',
        department: 'IT Operations'
      },
      {
        name: 'Sarah Connor (Support Engineer)',
        email: 'engineer@helpdesk.com',
        password: 'password123',
        role: 'support_engineer',
        department: 'Technical Support'
      },
      {
        name: 'Michael Scott (Customer)',
        email: 'customer@helpdesk.com',
        password: 'password123',
        role: 'customer',
        department: 'Sales & Marketing'
      }
    ];

    const results = [];
    for (const item of seedData) {
      let user = await User.findOne({ email: item.email });
      if (!user) {
        user = await User.create(item);
        results.push({ email: item.email, status: 'created', role: item.role });
      } else {
        results.push({ email: item.email, status: 'exists', role: user.role });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Demo accounts seeded successfully.',
      accounts: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error seeding users.'
    });
  }
};
