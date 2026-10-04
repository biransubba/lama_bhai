const mongoose = require('mongoose');
const Property = require('../models/Property');
const Room = require('../models/Room');
const { createSlug } = require('../utils/slugify');

/**
 * @desc    Submit a new property listing for moderation
 * @route   POST /api/owner/properties
 * @access  Private (Owner / Admin)
 */
exports.createProperty = async (req, res, next) => {
  try {
    const {
      name,
      type,
      description,
      location,
      price,
      image,
      gallery,
      amenities,
      contactDetails,
    } = req.body;

    // 1. Basic validation
    if (!name || !type || !description || !location || !location.district || !location.town || !price || !image) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, type, description, district, town, price, and cover image',
      });
    }

    // 2. Generate unique slug
    let baseSlug = createSlug(name);
    let slug = baseSlug;
    let counter = 1;
    while (await Property.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // 3. Create property with pending status
    const propertyData = {
      name: name.trim(),
      slug,
      type,
      owner: req.user._id,
      description: description.trim(),
      location: {
        district: location.district,
        town: location.town.trim(),
        address: location.address ? location.address.trim() : '',
        coordinates: location.coordinates || { latitude: null, longitude: null },
      },
      price: Number(price),
      image: image.trim(),
      gallery: Array.isArray(gallery)
        ? gallery.map((item) =>
            typeof item === 'string'
              ? { src: item.trim(), alt: name.trim(), category: 'Property' }
              : item
          )
        : [],
      amenities: Array.isArray(amenities) ? amenities : [],
      status: req.user.role === 'admin' && req.body.status ? req.body.status : 'pending',
      active: true,
      contactDetails: {
        phone: contactDetails?.phone || req.user.phone || '',
        email: contactDetails?.email || req.user.email || '',
      },
    };

    const property = await Property.create(propertyData);

    return res.status(201).json({
      success: true,
      message: 'Property submitted successfully! It is now pending moderation review.',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all properties owned by the authenticated owner
 * @route   GET /api/owner/properties
 * @access  Private (Owner / Admin)
 */
exports.getMyProperties = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' && req.query.all === 'true'
      ? {}
      : { owner: req.user._id };

    const properties = await Property.find(query)
      .populate('rooms')
      .sort({ createdAt: -1 })
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
 * @desc    Get single property details owned by the user
 * @route   GET /api/owner/properties/:id
 * @access  Private (Owner / Admin)
 */
exports.getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID format' });
    }

    const property = await Property.findById(id)
      .populate('rooms')
      .populate('reviews');

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Ownership check
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to manage this property',
      });
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
 * @desc    Update property details
 * @route   PUT /api/owner/properties/:id
 * @access  Private (Owner / Admin)
 */
exports.updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID format' });
    }

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Ownership check
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to modify this property',
      });
    }

    // Whitelist allowed fields for owner update
    const allowedFields = [
      'name',
      'type',
      'description',
      'price',
      'image',
      'gallery',
      'amenities',
      'location',
      'contactDetails',
      'availability',
      'active',
    ];

    const contentFields = ['name', 'type', 'description', 'image', 'gallery', 'location'];
    const hasContentChanges = contentFields.some((f) => req.body[f] !== undefined);

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });

    if (req.body.availability !== undefined) {
      property.active = req.body.availability === 'available';
    }

    // If an ordinary owner updates major listing content on a previously approved property, re-flag for moderation
    if (req.user.role !== 'admin' && property.status === 'approved' && hasContentChanges) {
      property.status = 'pending';
    }

    // Admins can explicitly change status
    if (req.user.role === 'admin' && req.body.status) {
      property.status = req.body.status;
    }

    await property.save();

    return res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Archive / deactivate property
 * @route   DELETE /api/owner/properties/:id
 * @access  Private (Owner / Admin)
 */
exports.deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID format' });
    }

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Ownership check
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to delete this property',
      });
    }

    // Soft delete property and its rooms
    property.active = false;
    await property.save();

    await Room.updateMany({ property: property._id }, { active: false });

    return res.status(200).json({
      success: true,
      message: 'Property and associated rooms have been deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a room to an owner's property
 * @route   POST /api/owner/properties/:id/rooms
 * @access  Private (Owner / Admin)
 */
exports.addRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      description,
      capacity,
      bedConfiguration,
      price,
      amenities,
      image,
      gallery,
      availability,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID format' });
    }

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Ownership check
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to add rooms to this property',
      });
    }

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Please provide room name and price per night',
      });
    }

    const room = await Room.create({
      property: property._id,
      name: name.trim(),
      type: type || 'Standard Room',
      description: description ? description.trim() : '',
      capacity: Number(capacity) || 2,
      bedConfiguration: bedConfiguration || '1 King Bed',
      price: Number(price),
      amenities: Array.isArray(amenities) ? amenities : [],
      image: image || '',
      gallery: Array.isArray(gallery) ? gallery : [],
      availability: availability || 'available',
      status: status === 'draft' ? 'draft' : 'published',
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Room added successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update room details
 * @route   PUT /api/owner/rooms/:roomId
 * @access  Private (Owner / Admin)
 */
exports.updateRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID format' });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Verify parent property ownership
    const property = await Property.findById(room.property);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Parent property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to modify this room',
      });
    }

    const allowedUpdates = [
      'name',
      'type',
      'description',
      'capacity',
      'bedConfiguration',
      'price',
      'amenities',
      'image',
      'gallery',
      'availability',
      'status',
      'active',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        room[field] = req.body[field];
      }
    });

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete / deactivate room
 * @route   DELETE /api/owner/rooms/:roomId
 * @access  Private (Owner / Admin)
 */
exports.deleteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID format' });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Verify parent property ownership
    const property = await Property.findById(room.property);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Parent property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to delete this room',
      });
    }

    room.active = false;
    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Room deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
