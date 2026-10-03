const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required for SEO friendly routing'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      maxlength: [100, 'Destination name cannot exceed 100 characters'],
    },
    tag: {
      type: String,
      trim: true,
      default: 'Mountain village',
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      enum: {
        values: [
          'North Sikkim',
          'West Sikkim',
          'East Sikkim',
          'South Sikkim',
          'Pakyong',
          'Soreng',
        ],
        message: '{VALUE} is not a valid Sikkim district',
      },
      default: 'North Sikkim',
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short summary description is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed destination description is required'],
      trim: true,
    },
    whyVisit: {
      type: [String],
      default: [],
    },
    highlights: {
      type: [String],
      default: [],
    },
    travelInfo: {
      type: String,
      trim: true,
      default: '',
    },
    permitNote: {
      type: String,
      trim: true,
      default: '',
    },
    bestTimeToVisit: {
      type: String,
      trim: true,
      default: 'March to May & October to Mid-December',
    },
    images: {
      hero: { type: String, default: null },
      card: { type: String, default: null },
      thumbnail: { type: String, default: null },
      gallery: [{ type: String }],
    },
    relatedSlugs: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

destinationSchema.index({ district: 1, isActive: 1 });
destinationSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
