const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Review must be linked to a Property'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a registered User'],
      index: true,
    },
    userName: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a user from submitting multiple reviews for the same property
reviewSchema.index({ property: 1, user: 1 }, { unique: true });

// Static method to recalculate average rating on Property
reviewSchema.statics.calcAverageRating = async function (propertyId) {
  const stats = await this.aggregate([
    {
      $match: { property: propertyId, isApproved: true },
    },
    {
      $group: {
        _id: '$property',
        numReviews: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Property').findByIdAndUpdate(propertyId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].numReviews,
    });
  } else {
    await mongoose.model('Property').findByIdAndUpdate(propertyId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

// Automatically recalculate rating after save
reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.property);
});

// Automatically recalculate rating after remove / delete
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.property);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
