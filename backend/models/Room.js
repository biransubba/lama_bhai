const mongoose = require('mongoose');

const roomGallerySchema = new mongoose.Schema(
  {
    src: { type: String, required: true, trim: true },
    alt: { type: String, default: '', trim: true },
    category: { type: String, default: 'Room', trim: true },
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Room must be linked to a Property'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide room name / title'],
      trim: true,
      default: 'Standard Room',
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: [
          'Standard Room',
          'Deluxe Room',
          'Super Deluxe Room',
          'Family Room',
          'Suite',
          'Traditional Wooden Room',
          'Cottage / Cabin',
          'Dormitory',
        ],
        message: '{VALUE} is not a valid room type',
      },
      default: 'Standard Room',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Max guest capacity is required'],
      min: [1, 'Capacity must be at least 1 guest'],
      default: 2,
    },
    bedConfiguration: {
      type: String,
      trim: true,
      default: '1 King Bed',
    },
    price: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    gallery: {
      type: [roomGallerySchema],
      default: [],
    },
    availability: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
      index: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding rooms by property and availability
roomSchema.index({ property: 1, availability: 1, active: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
