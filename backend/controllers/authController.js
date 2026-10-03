const passport = require('passport');
const User = require('../models/User');

/**
 * @desc    Register a new user (Tourist or Property Owner)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, agencyName, location, notes } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists',
      });
    }

    // 3. Prevent self-registration as admin
    const assignedRole = role === 'owner' ? 'owner' : 'tourist';

    // 4. Construct user payload
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      phone: phone ? phone.trim() : '',
    };

    // If registering as a partner/owner, initialize partner profile
    if (assignedRole === 'owner') {
      userData.partnerProfile = {
        agencyName: agencyName ? agencyName.trim() : '',
        location: location ? location.trim() : 'Sikkim',
        verificationStatus: 'Pending',
        notes: notes ? notes.trim() : '',
      };
    }

    // 5. Create user (password will be automatically hashed by pre-save hook)
    const user = await User.create(userData);

    // 6. Establish session immediately upon registration
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).json({
        success: true,
        message: 'Account registered and logged in successfully',
        user,
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in user with email & password
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: info?.message || 'Invalid email or password',
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        user,
      });
    });
  })(req, res, next);
};

/**
 * @desc    Log out current user & destroy session
 * @route   POST /api/auth/logout
 * @access  Private / Public
 */
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          return next(destroyErr);
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully',
        });
      });
    } else {
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  });
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      user: null,
      message: 'Not authenticated',
    });
  }

  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
