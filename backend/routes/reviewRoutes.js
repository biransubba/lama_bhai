const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Route: /api/properties/:propertyId/reviews (GET list, POST create)
// Also handles /api/reviews
router
  .route('/')
  .get(reviewController.getPropertyReviews)
  .post(protect, reviewController.createReview);

// Route: /api/reviews/:id (PUT update, DELETE delete)
router
  .route('/:id')
  .put(protect, reviewController.updateReview)
  .delete(protect, reviewController.deleteReview);

module.exports = router;
