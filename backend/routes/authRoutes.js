const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration endpoint
router.post('/register', authController.register);

// Login endpoint
router.post('/login', authController.login);

// Logout endpoint
router.post('/logout', authController.logout);

// Current user profile endpoint
router.get('/me', authController.getMe);

module.exports = router;
