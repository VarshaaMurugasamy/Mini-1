const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users with role filtering (Admin only)
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users.'
    });
  }
};

// @route   GET /api/users/engineers
// @desc    Get all active support engineers for assignment dropdowns
// @access  Private (Support Engineer, Admin)
exports.getEngineers = async (req, res) => {
  try {
    const engineers = await User.find({
      role: { $in: ['support_engineer', 'admin'] }
    }).select('name email role department avatar').sort({ name: 1 });

    return res.status(200).json({
      success: true,
      engineers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving support engineers.'
    });
  }
};

// @route   PATCH /api/users/:id/role
// @desc    Update a user's role (Admin only)
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['customer', 'support_engineer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided.'
      });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot alter their own role.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating user role.'
    });
  }
};
