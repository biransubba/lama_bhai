const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
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
router.post('/properties/:id/rooms', ownerController.addRoom);
router.put('/rooms/:roomId', ownerController.updateRoom);
router.delete('/rooms/:roomId', ownerController.deleteRoom);

module.exports = router;
