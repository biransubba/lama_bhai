const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema(
  {
    src: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Property',
      trim: true,
    },
  },
  { _id: true }
);

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide property name'],
      trim: true,
      maxlength: [150, 'Property name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required for SEO friendly URLs'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Property type is required'],
      enum: {
        values: ['Homestay', 'Hotel', 'Guest House', 'Resort', 'Lodge', 'Cottage'],
        message: '{VALUE} is not a valid property type',
      },
      default: 'Homestay',
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property must belong to a registered owner/host'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide property description'],
      trim: true,
    },
    location: {
      district: {
        type: String,
        required: [true, 'District is required'],
        enum: [
          'East Sikkim',
          'West Sikkim',
          'North Sikkim',
          'South Sikkim',
          'Pakyong',
          'Soreng',
          'Other',
        ],
        default: 'East Sikkim',
        index: true,
      },
      town: {
        type: String,
        required: [true, 'Town / Village is required'],
        trim: true,
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
      coordinates: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: [true, 'Base price per night is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Cover image is required'],
      trim: true,
    },
    gallery: {
      type: [galleryItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid property status',
      },
      default: 'pending',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    availability: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    contactDetails: {
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to populate rooms belonging to this property
propertySchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'property',
});

// Virtual field to populate reviews for this property
propertySchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'property',
});

// Compound index for optimized search & filters
propertySchema.index({ status: 1, active: 1, 'location.district': 1, type: 1 });
propertySchema.index({ name: 'text', description: 'text', 'location.town': 'text' });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
