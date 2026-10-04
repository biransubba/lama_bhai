const mongoose = require('mongoose');
const { Booking, Property, Room, User } = require('../models');

/**
 * @desc    Create a new booking request (Customer reservation for Stays, Vehicles, Permits)
 * @route   POST /api/bookings
 * @access  Public (Authenticated or Guest)
 */
exports.createBooking = async (req, res, next) => {
  try {
    const {
      service = 'Stay',
      propertyId,
      roomId,
      customerDetails,
      schedule,
      travellers = 1,
      notes,
      permitData,
    } = req.body;

    // 1. Validate customer details
    const name = customerDetails?.name || req.user?.name;
    const email = customerDetails?.email || req.user?.email;
    const phone = customerDetails?.phone || req.user?.phone;
    const nationality = customerDetails?.nationality || 'Indian';

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide customer name, email, and phone number',
      });
    }

    const bookingPayload = {
      service,
      user: req.user ? req.user._id : null,
      customerDetails: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        nationality: nationality.trim(),
      },
      travellers: Math.max(1, Number(travellers) || 1),
      notes: notes ? notes.trim() : '',
      permitData: permitData || null,
      status: 'New',
    };

    // 2. Schedule calculations
    if (schedule) {
      const checkInDate = schedule.checkIn ? new Date(schedule.checkIn) : null;
      const checkOutDate = schedule.checkOut ? new Date(schedule.checkOut) : null;
      let nights = schedule.nights ? Number(schedule.nights) : 1;

      if (checkInDate && checkOutDate) {
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
          return res.status(400).json({ success: false, error: 'Invalid check-in or check-out date' });
        }
        if (checkOutDate <= checkInDate) {
          return res.status(400).json({ success: false, error: 'Check-out date must be after check-in date' });
        }
        const diffTime = checkOutDate - checkInDate;
        nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      bookingPayload.schedule = {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
      };
    } else {
      bookingPayload.schedule = { nights: 1 };
    }

    // 3. Service specific handling (e.g. Stays)
    if (service === 'Stay') {
      if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(400).json({ success: false, error: 'Valid property ID is required for stay bookings' });
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ success: false, error: 'Stay property not found' });
      }

      // Step 16: Property must be approved and active
      if (property.status !== 'approved' || !property.active) {
        return res.status(400).json({
          success: false,
          error: 'This property is not currently available for booking',
        });
      }

      bookingPayload.property = property._id;
      bookingPayload.propertyName = property.name;
      bookingPayload.partner = property.owner; // Assign host

      let unitPrice = property.price;

      if (roomId) {
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
          return res.status(400).json({ success: false, error: 'Invalid room ID' });
        }

        const room = await Room.findOne({ _id: roomId, property: property._id });
        if (!room) {
          return res.status(404).json({ success: false, error: 'Room not found for this property' });
        }

        // Step 18: Inactive or unavailable room cannot be booked
        if (room.active === false || room.availability === 'unavailable' || room.availability === 'maintenance') {
          return res.status(400).json({
            success: false,
            error: 'Selected room is currently unavailable for booking',
          });
        }

        bookingPayload.room = room._id;
        bookingPayload.roomName = room.name;
        unitPrice = room.price;
      }

      const nights = bookingPayload.schedule.nights || 1;
      bookingPayload.pricing = {
        totalPrice: unitPrice * nights,
        currency: 'INR',
        paymentStatus: 'pending',
      };
    } else {
      bookingPayload.pricing = {
        totalPrice: req.body.totalPrice ? Number(req.body.totalPrice) : 0,
        currency: 'INR',
        paymentStatus: 'pending',
      };
    }

    // 4. Save booking (pre-save hook auto-generates bookingRequestId)
    const booking = await Booking.create(bookingPayload);

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully!',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's booking history
 * @route   GET /api/bookings/my
 * @access  Private (Tourist)
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('property', 'name slug location image price')
      .populate('room', 'name type capacity price')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lookup booking details by bookingRequestId or ID
 * @route   GET /api/bookings/:id
 * @access  Public / Private
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { bookingRequestId: id }] } : { bookingRequestId: id };

    const booking = await Booking.findOne(query)
      .populate('property', 'name slug location image price')
      .populate('room', 'name type capacity price')
      .populate('partner', 'name partnerProfile');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking reservation not found' });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking request
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private (Customer or Admin)
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { bookingRequestId: id }] } : { bookingRequestId: id };

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking reservation not found' });
    }

    // Permission check: if logged in, must be booking customer, host, or admin
    if (req.user) {
      const isOwner = booking.user && booking.user.toString() === req.user._id.toString();
      const isPartner = booking.partner && booking.partner.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isPartner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not have permission to cancel this booking',
        });
      }
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, error: 'Completed bookings cannot be cancelled' });
    }

    booking.status = 'Cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: req.user ? req.user.name : booking.customerDetails.name,
      reason: reason || 'Customer requested cancellation',
      notes: notes || '',
    };

    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking request has been cancelled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking requests assigned to the logged-in partner/owner
 * @route   GET /api/owner/bookings
 * @access  Private (Owner / Admin)
 */
exports.getOwnerBookings = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { partner: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('property', 'name slug image')
      .populate('room', 'name type capacity')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking status by partner/owner (Contacted, In Progress, Confirmed, Completed)
 * @route   PATCH /api/owner/bookings/:id/status
 * @access  Private (Owner / Admin)
 */
exports.updateBookingStatusByOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Contacted', 'In Progress', 'Confirmed', 'Completed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { bookingRequestId: id }] } : { bookingRequestId: id };

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking reservation not found' });
    }

    // Ownership check: must be the assigned host or admin
    if ((!booking.partner || booking.partner.toString() !== req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to manage this booking',
      });
    }

    booking.status = status;
    if (status === 'Cancelled') {
      booking.cancellation = {
        cancelledAt: new Date(),
        cancelledBy: req.user.name,
        reason: req.body.reason || 'Cancelled by Host/Admin',
      };
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking status updated to '${status}' successfully`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings across the platform for admin overview
 * @route   GET /api/admin/bookings
 * @access  Private (Admin only)
 */
exports.getAllBookingsAdmin = async (req, res, next) => {
  try {
    const { service, status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (service && service !== 'all') filter.service = service;
    if (status && status !== 'all') filter.status = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { bookingRequestId: searchRegex },
        { 'customerDetails.name': searchRegex },
        { 'customerDetails.email': searchRegex },
        { 'customerDetails.phone': searchRegex },
        { propertyName: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('property', 'name slug')
        .populate('partner', 'name email phone partnerProfile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};
