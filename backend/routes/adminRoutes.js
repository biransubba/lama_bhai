const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes strictly require authenticated admin
router.use(protect);
router.use(authorize('admin'));

// Property Moderation
router.get('/properties', adminController.getAllProperties);
router.patch('/properties/:id/status', adminController.updatePropertyStatus);

// Partner Management & Verification
router.get('/partners', adminController.getAllPartners);
router.patch('/partners/:userId/status', adminController.updatePartnerStatus);

// Platform Overview Statistics
router.get('/stats', adminController.getAdminStats);

module.exports = router;
