const mongoose = require('mongoose');
const { Review, Property } = require('../models');

/**
 * @desc    Submit a review and rating for a property
 * @route   POST /api/properties/:propertyId/reviews
 * @access  Private (Authenticated users / Tourists)
 */
exports.createReview = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both rating (1-5) and review comment',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer or decimal between 1 and 5',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID format' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Check if user already reviewed this property
    const existingReview = await Review.findOne({
      property: property._id,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted a review for this property. You can edit your existing review.',
      });
    }

    const review = await Review.create({
      property: property._id,
      user: req.user._id,
      userName: req.user.name,
      rating: numRating,
      comment: comment.trim(),
      isApproved: true, // Default approved; admin can moderate if flagged
    });

    // Fetch updated property rating
    const updatedProperty = await Property.findById(property._id).select('rating numReviews');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: review,
      propertyRating: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all approved reviews for a specific property
 * @route   GET /api/properties/:propertyId/reviews
 * @access  Public
 */
exports.getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID format' });
    }

    const reviews = await Review.find({
      property: propertyId,
      isApproved: true,
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing review
 * @route   PUT /api/reviews/:id
 * @access  Private (Author or Admin)
 */
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID format' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Ownership check
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to modify this review',
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5',
        });
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    await review.save();

    // Fetch updated property rating
    const updatedProperty = await Property.findById(review.property).select('rating numReviews');

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
      propertyRating: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Author or Admin)
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID format' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Ownership check
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to delete this review',
      });
    }

    const propertyId = review.property;
    await Review.findByIdAndDelete(id);

    // Fetch updated property rating
    const updatedProperty = await Property.findById(propertyId).select('rating numReviews');

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
      propertyRating: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin review moderation (hide, approve, or flag)
 * @route   PATCH /api/admin/reviews/:id/moderation
 * @access  Private (Admin only)
 */
exports.moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (isApproved === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Please specify boolean isApproved in body',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID format' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    review.isApproved = Boolean(isApproved);
    await review.save();

    // Trigger recalculation on property
    await Review.calcAverageRating(review.property);
    const updatedProperty = await Property.findById(review.property).select('rating numReviews');

    return res.status(200).json({
      success: true,
      message: `Review moderation status updated to: ${review.isApproved ? 'Approved' : 'Hidden'}`,
      data: review,
      propertyRating: updatedProperty,
    });
  } catch (error) {
    next(error);
  }
};
