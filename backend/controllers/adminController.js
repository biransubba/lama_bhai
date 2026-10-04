const mongoose = require('mongoose');
const { Property, Room, User, Booking } = require('../models');

/**
 * @desc    Get all properties with moderation filters for admin review
 * @route   GET /api/admin/properties
 * @access  Private (Admin only)
 */
exports.getAllProperties = async (req, res, next) => {
  try {
    const { status, district, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (district) {
      filter['location.district'] = new RegExp(`^${district.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { 'location.town': searchRegex },
        { 'location.district': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('owner', 'name email phone partnerProfile')
        .populate('rooms', 'name type capacity price availability')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve, reject, or reset moderation status of a property
 * @route   PATCH /api/admin/properties/:id/status
 * @access  Private (Admin only)
 */
exports.updatePropertyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewerNotes, featured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID format' });
    }

    const validStatuses = ['approved', 'rejected', 'pending', 'draft'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    property.status = status;
    if (reviewerNotes !== undefined) {
      property.reviewerNotes = reviewerNotes;
    }
    if (featured !== undefined) {
      property.featured = Boolean(featured);
    }

    await property.save();

    return res.status(200).json({
      success: true,
      message: `Property status updated to '${status}' successfully`,
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered partners/hosts with verification status
 * @route   GET /api/admin/partners
 * @access  Private (Admin only)
 */
exports.getAllPartners = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filter = { role: 'owner' };

    if (status && status !== 'all') {
      filter['partnerProfile.verificationStatus'] = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { 'partnerProfile.agencyName': searchRegex },
        { 'partnerProfile.location': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [partners, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Attach property counts to each partner
    const partnerIds = partners.map((p) => p._id);
    const propertyCounts = await Property.aggregate([
      { $match: { owner: { $in: partnerIds } } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    propertyCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const enrichedPartners = partners.map((partner) => ({
      ...partner,
      propertiesCount: countMap[partner._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedPartners.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: enrichedPartners,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve, reject, or suspend a partner/host account
 * @route   PATCH /api/admin/partners/:userId/status
 * @access  Private (Admin only)
 */
exports.updatePartnerStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, reviewerNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    const validStatuses = ['Approved', 'Rejected', 'Suspended', 'Inactive', 'Pending'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'owner') {
      return res.status(400).json({ success: false, error: 'User is not a registered partner/owner' });
    }

    if (!user.partnerProfile) {
      user.partnerProfile = {};
    }

    user.partnerProfile.verificationStatus = status;
    user.partnerProfile.reviewedAt = new Date();
    if (reviewerNotes !== undefined) {
      user.partnerProfile.reviewerNotes = reviewerNotes;
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: `Partner verification status updated to '${status}' successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics & overview stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    const [
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      totalPartners,
      pendingPartners,
      totalTourists,
      totalRooms,
      totalBookings,
    ] = await Promise.all([
      Property.countDocuments({ active: true }),
      Property.countDocuments({ status: 'pending', active: true }),
      Property.countDocuments({ status: 'approved', active: true }),
      Property.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'owner', isActive: true }),
      User.countDocuments({ role: 'owner', 'partnerProfile.verificationStatus': 'Pending' }),
      User.countDocuments({ role: 'tourist', isActive: true }),
      Room.countDocuments({ active: true }),
      Booking.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        properties: {
          total: totalProperties,
          pending: pendingProperties,
          approved: approvedProperties,
          rejected: rejectedProperties,
        },
        partners: {
          total: totalPartners,
          pendingVerification: pendingPartners,
          active: totalPartners - pendingPartners,
        },
        users: {
          tourists: totalTourists,
        },
        inventory: {
          rooms: totalRooms,
        },
        bookings: {
          total: totalBookings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
