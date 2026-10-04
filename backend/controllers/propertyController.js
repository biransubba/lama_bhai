const mongoose = require('mongoose');
const Property = require('../models/Property');
const Room = require('../models/Room');

/**
 * @desc    Get all public approved properties with filtering, search, sorting & pagination
 * @route   GET /api/properties
 * @access  Public
 */
exports.getProperties = async (req, res, next) => {
  try {
    const {
      district,
      type,
      minPrice,
      maxPrice,
      town,
      search,
      amenities,
      featured,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    // Base filter: public visitors can only see active & approved properties
    const filter = {
      status: 'approved',
      active: true,
    };

    // Filter by Sikkim district
    if (district) {
      filter['location.district'] = new RegExp(`^${district.trim()}$`, 'i');
    }

    // Filter by property type / category
    if (type) {
      filter.type = type.trim();
    }

    // Filter by town / village
    if (town) {
      filter['location.town'] = new RegExp(town.trim(), 'i');
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Filter by featured flag
    if (featured !== undefined) {
      filter.featured = featured === 'true' || featured === true;
    }

    // Filter by amenities (comma separated)
    if (amenities) {
      const amenitiesList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (amenitiesList.length > 0) {
        filter.amenities = { $all: amenitiesList };
      }
    }

    // Text search on name, town, or description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { 'location.town': searchRegex },
        { 'location.district': searchRegex },
        { description: searchRegex },
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1, numReviews: -1 };
    } else if (sort === 'name_asc') {
      sortOptions = { name: 1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [properties, totalDocs] = await Promise.all([
      Property.find(filter)
        .populate('owner', 'name avatar partnerProfile.agencyName partnerProfile.location')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: properties.length,
      total: totalDocs,
      totalPages: Math.ceil(totalDocs / limitNum),
      currentPage: pageNum,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get featured properties for landing page showcase
 * @route   GET /api/properties/featured
 * @access  Public
 */
exports.getFeaturedProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({
      status: 'approved',
      active: true,
      $or: [{ featured: true }, { rating: { $gte: 4.5 } }],
    })
      .populate('owner', 'name avatar partnerProfile.agencyName')
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .lean();

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single property details by slug (or ID) with populated rooms and reviews
 * @route   GET /api/properties/:slug
 * @access  Public (Owner & Admin can preview unapproved)
 */
exports.getPropertyBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Check if parameter is a valid MongoDB ObjectId or a slug string
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { $or: [{ _id: slug }, { slug }] } : { slug };

    const property = await Property.findOne(query)
      .populate('owner', 'name email avatar phone partnerProfile.agencyName partnerProfile.location')
      .populate({
        path: 'rooms',
        match: { active: true },
        select: 'name type description capacity bedConfiguration price amenities image gallery availability',
      })
      .populate({
        path: 'reviews',
        match: { isApproved: true },
        select: 'userName rating comment createdAt user',
        populate: { path: 'user', select: 'name avatar' },
      });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    // Access control for non-approved or inactive properties
    if (property.status !== 'approved' || !property.active) {
      const isOwner = req.user && req.user._id.toString() === property.owner._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(404).json({
          success: false,
          error: 'Property is currently pending moderation or inactive',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get room inventory for a specific property
 * @route   GET /api/properties/:id/rooms
 * @access  Public
 */
exports.getPropertyRooms = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find property by ID or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const propertyQuery = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const property = await Property.findOne(propertyQuery).select('_id name status active');
    if (!property || property.status !== 'approved' || !property.active) {
      return res.status(404).json({
        success: false,
        error: 'Property not found or not approved',
      });
    }

    const rooms = await Room.find({
      property: property._id,
      active: true,
    }).sort({ price: 1 });

    return res.status(200).json({
      success: true,
      property: {
        _id: property._id,
        name: property.name,
      },
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single room for a specific property (validates room belongs to property)
 * @route   GET /api/properties/:id/rooms/:roomId
 * @access  Public
 */
exports.getPropertyRoomById = async (req, res, next) => {
  try {
    const { id, roomId } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const propertyQuery = isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };

    const property = await Property.findOne(propertyQuery).select('_id name status active');
    if (!property || property.status !== 'approved' || !property.active) {
      return res.status(404).json({
        success: false,
        error: 'Property not found or not approved',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    const room = await Room.findOne({
      _id: roomId,
      property: property._id,
      active: true,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found for this property',
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

