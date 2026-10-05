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
      trim: true,
      default: 'Standard',
    },
    customType: {
      type: String,
      trim: true,
      default: '',
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
    bedType: {
      type: String,
      trim: true,
      default: 'Double Bed',
    },
    customBedType: {
      type: String,
      trim: true,
      default: '',
    },
    numberOfBeds: {
      type: Number,
      min: [1, 'Must have at least 1 bed'],
      default: 1,
    },
    bedConfiguration: {
      type: String,
      trim: true,
      default: '1 Double Bed',
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
      default: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
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
      enum: ['pending', 'approved', 'rejected', 'published', 'draft'],
      default: 'pending',
      index: true,
    },
    location: {
      district: { type: String, trim: true, default: '' },
      town: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
      formatted: { type: String, trim: true, default: '' },
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    reviewerNotes: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

// Index for finding rooms by property, status, and availability
roomSchema.index({ property: 1, status: 1, availability: 1, active: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
