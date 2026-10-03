const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingRequestId: {
      type: String,
      unique: true,
      index: true,
    },
    service: {
      type: String,
      required: [true, 'Service type is required'],
      enum: {
        values: ['Stay', 'Car', 'Bike', 'Permit', 'Plan My Trip'],
        message: '{VALUE} is not a supported service',
      },
      default: 'Stay',
      index: true,
    },
    // Optional registered user link (guest bookings supported)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Associated Property (for Stays)
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
      index: true,
    },
    propertyName: {
      type: String,
      trim: true,
      default: '',
    },
    // Associated Room (for room-specific stays)
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    roomName: {
      type: String,
      trim: true,
      default: '',
    },
    // Associated Partner / Property Owner
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Customer Contact Information
    customerDetails: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: [true, 'Customer phone number is required'],
        trim: true,
      },
      nationality: {
        type: String,
        trim: true,
        default: 'Indian',
      },
    },
    // Schedule details
    schedule: {
      checkIn: {
        type: Date,
        default: null,
      },
      checkOut: {
        type: Date,
        default: null,
      },
      nights: {
        type: Number,
        min: 1,
        default: 1,
      },
    },
    travellers: {
      type: Number,
      min: [1, 'At least 1 traveller is required'],
      default: 1,
    },
    // Financial details
    pricing: {
      totalPrice: {
        type: Number,
        min: 0,
        default: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
        default: 'pending',
      },
    },
    // Booking lifecycle status matching frontend schema
    status: {
      type: String,
      enum: {
        values: [
          'New',
          'Contacted',
          'In Progress',
          'Confirmed',
          'Completed',
          'Cancelled',
        ],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'New',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    // Cancellation details if request is cancelled
    cancellation: {
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: String, default: null },
      reason: { type: String, default: null },
      notes: { type: String, default: null },
    },
    // North Sikkim or Special Permit data payload
    permitData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate friendly unique bookingRequestId before saving if not present
bookingSchema.pre('save', function () {
  if (!this.bookingRequestId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingRequestId = `LB-${this.service ? this.service.slice(0, 2).toUpperCase() : 'BK'}-${timestamp}-${random}`;
  }
});

// Compound indexes for performant partner & admin queries
bookingSchema.index({ partner: 1, status: 1, createdAt: -1 });
bookingSchema.index({ user: 1, status: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
