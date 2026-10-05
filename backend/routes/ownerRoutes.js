const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const bookingController = require('../controllers/bookingController');
const {
  protect,
  authorize,
  ensureApprovedOwner,
} = require('../middleware/authMiddleware');

// All owner routes require authentication and owner/admin role with non-suspended partner status
router.use(protect);
router.use(authorize('owner', 'admin'));
router.use(ensureApprovedOwner);

// Property CRUD
router.post('/properties', ownerController.createProperty);
router.get('/properties', ownerController.getMyProperties);
router.get('/properties/:id', ownerController.getPropertyById);
router.put('/properties/:id', ownerController.updateProperty);
router.delete('/properties/:id', ownerController.deleteProperty);

// Room CRUD
router.get('/rooms', ownerController.getMyRooms);
router.get('/rooms/:roomId', ownerController.getRoomById);
router.post('/rooms', ownerController.addRoom);
router.post('/properties/:id/rooms', ownerController.addRoom);
router.put('/rooms/:roomId', ownerController.updateRoom);
router.delete('/rooms/:roomId', ownerController.deleteRoom);

// Booking Requests Management for Host
router.get('/bookings', bookingController.getOwnerBookings);
router.patch('/bookings/:id/status', bookingController.updateBookingStatusByOwner);

module.exports = router;
