const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { validate } = require('../middlewares/validation');
const { protect, managerOnly } = require('../middlewares/auth');

const router = express.Router();

// @desc    Register user (Manager only can create staff)
// @route   POST /api/auth/register
// @access  Private (Manager only)
router.post('/register', protect, managerOnly, validate('registerUser'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      createdBy: req.user._id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate('loginUser'), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Request OTP for password reset
// @route   POST /api/auth/request-otp
// @access  Public
router.post('/request-otp', validate('requestOTP'), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via email
    try {
      await sendEmail({
        email: user.email,
        subject: 'StockMaster - Password Reset OTP',
        message: `Your OTP for password reset is: ${otp}. This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES} minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">StockMaster - Password Reset</h2>
            <p>You have requested a password reset for your StockMaster account.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="color: #374151; margin: 0;">Your OTP Code</h3>
              <h1 style="color: #7c3aed; font-size: 32px; letter-spacing: 4px; margin: 10px 0;">${otp}</h1>
              <p style="color: #6b7280; margin: 0;">This code will expire in ${process.env.OTP_EXPIRE_MINUTES} minutes</p>
            </div>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated message from StockMaster. Please do not reply.</p>
          </div>
        `,
        otp
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email'
      });
    } catch (emailError) {
      // Reset OTP fields if email fails
      user.otpCode = undefined;
      user.otpExpire = undefined;
      await user.save();

      res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', validate('verifyOTP'), async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', validate('resetPassword'), async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdBy: user.createdBy,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all warehouse staff (Manager only)
// @route   GET /api/auth/staff
// @access  Private (Manager only)
router.get('/staff', protect, managerOnly, async (req, res) => {
  try {
    const staff = await User.find({ 
      role: 'warehouse_staff',
      createdBy: req.user._id 
    }).select('-password').populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update staff status (Manager only)
// @route   PUT /api/auth/staff/:id/status
// @access  Private (Manager only)
router.put('/staff/:id/status', protect, managerOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const staff = await User.findOne({
      _id: req.params.id,
      role: 'warehouse_staff',
      createdBy: req.user._id
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.isActive = isActive;
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Staff ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        isActive: staff.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;