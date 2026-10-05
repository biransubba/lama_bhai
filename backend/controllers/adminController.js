const mongoose = require('mongoose');
const { Property, Room, User, Booking } = require('../models');
const { createSlug } = require('../utils/slugify');

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
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = { role: { $in: ['owner', 'partner'] } };

    if (status && status !== 'all') {
      filter['partnerProfile.verificationStatus'] = new RegExp(`^${status}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { 'partnerProfile.businessName': searchRegex },
        { 'partnerProfile.agencyName': searchRegex },
        { 'partnerProfile.location': searchRegex },
        { 'partnerProfile.town': searchRegex },
        { 'partnerProfile.district': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
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

    // Attach property and listings counts to each partner
    const partnerIds = partners.map((p) => p._id);
    const properties = await Property.find({ owner: { $in: partnerIds } }).select('_id owner').lean();

    const propOwnerMap = {};
    const propCountMap = {};
    const propIds = properties.map((p) => {
      const pIdStr = p._id.toString();
      const oIdStr = p.owner.toString();
      propOwnerMap[pIdStr] = oIdStr;
      propCountMap[oIdStr] = (propCountMap[oIdStr] || 0) + 1;
      return p._id;
    });

    const roomCounts = await Room.aggregate([
      { $match: { property: { $in: propIds }, active: true } },
      { $group: { _id: '$property', count: { $sum: 1 } } },
    ]);

    const listingCountMap = {};
    roomCounts.forEach((r) => {
      const ownerId = propOwnerMap[r._id.toString()];
      if (ownerId) {
        listingCountMap[ownerId] = (listingCountMap[ownerId] || 0) + r.count;
      }
    });

    const enrichedPartners = partners.map((partner) => {
      const pIdStr = partner._id.toString();
      return {
        ...partner,
        propertiesCount: propCountMap[pIdStr] || 0,
        listingsCount: listingCountMap[pIdStr] || 0,
      };
    });

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

    if (user.role !== 'owner' && user.role !== 'partner') {
      return res.status(400).json({ success: false, error: 'User is not a registered partner/owner' });
    }

    if (!user.partnerProfile) {
      user.partnerProfile = {};
    }

    user.partnerProfile.verificationStatus = status;
    user.partnerProfile.reviewedAt = new Date();
    const notesToSave = reviewerNotes !== undefined ? reviewerNotes : (req.body.notes !== undefined ? req.body.notes : undefined);
    if (notesToSave !== undefined) {
      user.partnerProfile.reviewerNotes = notesToSave;
      user.partnerProfile.notes = notesToSave;
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
 * @desc    Create a new partner/host account by Admin
 * @route   POST /api/admin/partners
 * @access  Private (Admin only)
 */
exports.createPartner = async (req, res, next) => {
  try {
    const {
      name,
      businessName,
      agencyName,
      phone,
      email,
      district,
      town,
      address,
      pincode,
      password,
      retypePassword,
      temporaryPassword,
      location,
    } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Partner full name is required' });
    }
    const finalBusinessName = (businessName || agencyName || '').trim();
    if (!finalBusinessName) {
      return res.status(400).json({ success: false, error: 'Business / Homestay Name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address' });
    }

    const finalDistrict = (district || 'South Sikkim').trim();
    const finalTown = (town || 'Namchi').trim();
    const finalAddress = (address || location || `${finalTown}, ${finalDistrict}`).trim();

    const finalPassword = password || temporaryPassword;
    const finalRetypePassword = retypePassword || finalPassword;
    const finalRole = req.body.role || (req.body.businessName ? 'partner' : 'owner');

    if (!finalPassword || finalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    if (finalPassword !== finalRetypePassword) {
      return res.status(400).json({
        success: false,
        error: 'Password and Retype Password must match',
      });
    }

    // 2. Check duplicate email (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email address already exists.',
      });
    }

    // 3. Create partner user (pre-save hook hashes password securely with bcrypt)
    const formattedLocation = `${finalTown}, ${finalDistrict}`;
    const partner = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: finalPassword,
      role: finalRole,
      partnerProfile: {
        businessName: finalBusinessName,
        agencyName: finalBusinessName,
        district: finalDistrict,
        town: finalTown,
        address: finalAddress,
        pincode: pincode ? String(pincode).trim() : '',
        location: formattedLocation,
        verificationStatus: 'Approved',
        notes: 'Account created directly by Administrator',
        reviewedAt: new Date(),
      },
      isActive: true,
    });

    // 4. Auto-create default parent Property container for this partner
    // This allows room listings to be added immediately without a separate property approval workflow
    let baseSlug = createSlug(finalBusinessName);
    let slug = baseSlug;
    let counter = 1;
    while (await Property.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    await Property.create({
      name: finalBusinessName,
      slug,
      type: 'Homestay',
      owner: partner._id,
      description: `Welcome to ${finalBusinessName}. Owned and operated by ${name.trim()} in ${finalTown}, ${finalDistrict}.`,
      location: {
        district: finalDistrict,
        town: finalTown,
        address: finalAddress,
        pincode: pincode ? String(pincode).trim() : '',
      },
      status: 'approved', // Pre-approved container so rooms are reviewed individually
      active: true,
      price: 0,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      contactDetails: {
        phone: phone.trim(),
        email: normalizedEmail,
      },
    });

    // 5. Return sanitized partner object
    const sanitized = partner.toObject();
    delete sanitized.password;

    return res.status(201).json({
      success: true,
      message: 'Partner created successfully.',
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all room listings for admin moderation
 * @route   GET /api/admin/rooms (or /api/admin/listings)
 * @access  Private (Admin only)
 */
exports.getAllListings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = { active: true };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate({
          path: 'property',
          select: 'name slug location image status owner',
          populate: {
            path: 'owner',
            select: 'name email phone partnerProfile',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Room.countDocuments(filter),
    ]);

    // Apply search filter in memory if searching across populated partner/property fields
    let filteredRooms = rooms;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredRooms = rooms.filter((r) => {
        const roomNameMatch = (r.name || '').toLowerCase().includes(q);
        const roomTypeMatch = (r.type || '').toLowerCase().includes(q);
        const propNameMatch = (r.property?.name || '').toLowerCase().includes(q);
        const partnerNameMatch = (r.property?.owner?.name || '').toLowerCase().includes(q);
        const locMatch =
          (r.location?.town || r.property?.location?.town || '').toLowerCase().includes(q) ||
          (r.location?.district || r.property?.location?.district || '').toLowerCase().includes(q);
        return roomNameMatch || roomTypeMatch || propNameMatch || partnerNameMatch || locMatch;
      });
    }

    return res.status(200).json({
      success: true,
      count: filteredRooms.length,
      total: search ? filteredRooms.length : total,
      totalPages: Math.ceil((search ? filteredRooms.length : total) / limitNum),
      currentPage: pageNum,
      data: filteredRooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject an individual room listing
 * @route   PATCH /api/admin/rooms/:id/status (or /api/admin/listings/:id/status)
 * @access  Private (Admin only)
 */
exports.updateListingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, reviewerNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid room listing ID format' });
    }

    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const room = await Room.findById(id).populate({
      path: 'property',
      select: 'name slug location owner',
      populate: { path: 'owner', select: 'name email phone' },
    });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    room.status = status;
    const finalReason = rejectionReason || reviewerNotes || '';
    if (finalReason) {
      room.rejectionReason = finalReason;
      room.reviewerNotes = finalReason;
    }
    room.reviewedAt = new Date();
    room.reviewedBy = req.user ? req.user._id : null;
    if (!room.image) {
      room.image = 'https://images.unsplash.com/photo-1590490360182-c33d57733427';
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: `Listing '${room.name}' status updated to '${status}' successfully`,
      data: room,
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
