const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const reviewRoutes = require('./reviewRoutes');
const { optionalAuth } = require('../middleware/authMiddleware');

// Re-route into other resource routers (Reviews)
router.use('/:propertyId/reviews', reviewRoutes);

// Public listing with optional authentication for previews
router.get('/', optionalAuth, propertyController.getProperties);

// Featured showcase
router.get('/featured', propertyController.getFeaturedProperties);

// Single property detail by slug
router.get('/:slug', optionalAuth, propertyController.getPropertyBySlug);

// Room inventory for property
router.get('/:id/rooms', propertyController.getPropertyRooms);

// Single room under property (ownership verified)
router.get('/:id/rooms/:roomId', propertyController.getPropertyRoomById);

module.exports = router;

