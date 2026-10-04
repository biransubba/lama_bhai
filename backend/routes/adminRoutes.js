const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes strictly require authenticated admin
router.use(protect);
router.use(authorize('admin'));

// Property Moderation
router.get('/properties', adminController.getAllProperties);
router.patch('/properties/:id/status', adminController.updatePropertyStatus);

// Partner Management & Verification
router.get('/partners', adminController.getAllPartners);
router.post('/partners', adminController.createPartner);
router.patch('/partners/:userId/status', adminController.updatePartnerStatus);

// Review Moderation
router.patch('/reviews/:id/moderation', reviewController.moderateReview);

// Platform Overview Statistics
router.get('/stats', adminController.getAdminStats);

// Master Bookings Dashboard
router.get('/bookings', bookingController.getAllBookingsAdmin);

module.exports = router;
