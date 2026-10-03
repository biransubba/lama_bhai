const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle, uploadMultiple } = require('../middleware/uploadMiddleware');

// Upload endpoints require authentication to prevent spam & resource exhaustion
router.post('/image', protect, uploadSingle, uploadController.uploadImage);
router.post('/gallery', protect, uploadMultiple, uploadController.uploadGallery);

module.exports = router;
