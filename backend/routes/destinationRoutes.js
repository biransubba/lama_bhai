const express = require('express');
const router = express.Router();
const {
  getDestinations,
  getDestinationBySlug,
  createDestination,
  updateDestination,
  deleteDestination,
} = require('../controllers/destinationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', getDestinations);
router.get('/:slug', getDestinationBySlug);

// Admin-protected content endpoints
router.post('/', protect, authorize('admin'), createDestination);
router.put('/:id', protect, authorize('admin'), updateDestination);
router.delete('/:id', protect, authorize('admin'), deleteDestination);

module.exports = router;
