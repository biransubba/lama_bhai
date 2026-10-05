const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');
const { adminAccess } = require('../middleware/authMiddleware');

// All admin routes require authenticated admin (protect + authorize('admin')),
// unless the temporary dev flag ADMIN_AUTH_BYPASS=true is set (never in production).
router.use(adminAccess);

// Property Moderation
router.get('/properties', adminController.getAllProperties);
router.patch('/properties/:id/status', adminController.updatePropertyStatus);

// Room Listings Moderation (Source-of-truth workflow: Admin approves each individual room listing)
router.get('/rooms', adminController.getAllListings);
router.get('/listings', adminController.getAllListings);
router.patch('/rooms/:id/status', adminController.updateListingStatus);
router.patch('/listings/:id/status', adminController.updateListingStatus);

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
