const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Create booking (Logged-in user or guest)
router.post('/', optionalAuth, bookingController.createBooking);

// Tourist's personal booking history
router.get('/my', protect, bookingController.getMyBookings);

// Lookup booking by ID or reference code
router.get('/:id', optionalAuth, bookingController.getBookingById);

// Customer cancellation
router.patch('/:id/cancel', optionalAuth, bookingController.cancelBooking);

module.exports = router;
