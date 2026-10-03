const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Public listing with optional authentication for previews
router.get('/', optionalAuth, propertyController.getProperties);

// Featured showcase
router.get('/featured', propertyController.getFeaturedProperties);

// Single property detail by slug
router.get('/:slug', optionalAuth, propertyController.getPropertyBySlug);

// Room inventory for property
router.get('/:id/rooms', propertyController.getPropertyRooms);

module.exports = router;
