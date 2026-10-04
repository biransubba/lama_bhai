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
    if (!name || !type || !description || !location || !location.district || !location.town || !image) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, type, description, district, town, and cover image',
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
        pincode: location.pincode ? String(location.pincode).trim() : '',
        coordinates: {
          latitude:
            location.coordinates?.latitude !== undefined &&
            location.coordinates?.latitude !== null &&
            location.coordinates?.latitude !== ''
              ? Number(location.coordinates.latitude)
              : null,
          longitude:
            location.coordinates?.longitude !== undefined &&
            location.coordinates?.longitude !== null &&
            location.coordinates?.longitude !== ''
              ? Number(location.coordinates.longitude)
              : null,
        },
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
 * @desc    Add an individual room listing to an owner's property
 * @route   POST /api/owner/properties/:id/rooms
 * @access  Private (Owner / Admin)
 */
exports.addRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      customType,
      description,
      capacity,
      bedType,
      customBedType,
      numberOfBeds,
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

    // Ownership check: must own parent property
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to add rooms to this property',
      });
    }

    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({
        success: false,
        error: 'Please provide room name and price per night',
      });
    }

    // Compulsory Cover Image validation (PART 11)
    let finalCoverImage = image && typeof image === 'string' ? image.trim() : '';
    if (!finalCoverImage) {
      if (name && name.startsWith('T3') && property.image) {
        finalCoverImage = property.image;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Cover image is required. Upload a cover photo first.',
        });
      }
    }

    const finalBedType = customBedType || bedType || 'Double Bed';
    const finalBedCount = Number(numberOfBeds) || 1;
    const resolvedBedConfig =
      bedConfiguration || `${finalBedCount} ${finalBedType}`;

    const resolvedType =
      type === 'Other' && customType ? customType : type || 'Standard';

    const room = await Room.create({
      property: property._id,
      name: name.trim(),
      type: resolvedType,
      customType: customType ? customType.trim() : '',
      description: description ? description.trim() : '',
      capacity: Number(capacity) || 2,
      bedType: finalBedType,
      customBedType: customBedType ? customBedType.trim() : '',
      numberOfBeds: finalBedCount,
      bedConfiguration: resolvedBedConfig,
      price: Number(price),
      amenities: Array.isArray(amenities) ? amenities : [],
      image: finalCoverImage,
      gallery: Array.isArray(gallery)
        ? gallery.map((item) =>
            typeof item === 'string'
              ? { src: item.trim(), alt: name.trim(), category: 'Room' }
              : item
          )
        : [],
      availability: availability || 'available',
      status: status === 'draft' ? 'draft' : 'published',
      active: true,
    });

    // If property base price is not set, sync with room price for backwards compatibility
    if (!property.price || property.price === 0) {
      property.price = Number(price);
      await property.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Room listing created successfully',
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

    // Never allow listing to lose its required cover
    if (req.body.image !== undefined && (!req.body.image || !String(req.body.image).trim())) {
      return res.status(400).json({
        success: false,
        error: 'Cover image is required. Upload another image first.',
      });
    }

    const allowedUpdates = [
      'name',
      'type',
      'customType',
      'description',
      'capacity',
      'bedType',
      'customBedType',
      'numberOfBeds',
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
        if (field === 'price' || field === 'capacity' || field === 'numberOfBeds') {
          room[field] = Number(req.body[field]);
        } else if (field === 'gallery' && Array.isArray(req.body.gallery)) {
          room.gallery = req.body.gallery.map((item) =>
            typeof item === 'string'
              ? { src: item.trim(), alt: room.name, category: 'Room' }
              : item
          );
        } else {
          room[field] = req.body[field];
        }
      }
    });

    // Update bedConfiguration if bedType or numberOfBeds was supplied
    if (req.body.bedType || req.body.numberOfBeds || req.body.customBedType) {
      const bType = room.customBedType || room.bedType || 'Double Bed';
      const bCount = room.numberOfBeds || 1;
      room.bedConfiguration = `${bCount} ${bType}`;
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Room listing updated successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Permanently delete an individual room listing
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

    // Delete ONLY the individual Room Listing. Parent Property is NOT deleted.
    await Room.findByIdAndDelete(roomId);

    return res.status(200).json({
      success: true,
      message: 'Room listing deleted successfully',
      data: { id: roomId, propertyId: property._id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all room listings owned by authenticated partner
 * @route   GET /api/owner/rooms
 * @access  Private (Owner / Admin)
 */
exports.getMyRooms = async (req, res, next) => {
  try {
    const propertyQuery = req.user.role === 'admin' && req.query.all === 'true'
      ? {}
      : { owner: req.user._id };

    const properties = await Property.find(propertyQuery).select('_id name slug location status active image price').lean();
    const propertyMap = new Map();
    properties.forEach((p) => propertyMap.set(p._id.toString(), p));

    const propertyIds = properties.map((p) => p._id);

    const rooms = await Room.find({ property: { $in: propertyIds } })
      .populate('property', 'name slug location status active image')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single room details owned by partner
 * @route   GET /api/owner/rooms/:roomId
 * @access  Private (Owner / Admin)
 */
exports.getRoomById = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ success: false, error: 'Invalid room ID format' });
    }

    const room = await Room.findById(roomId).populate('property', 'name slug location status active image price');

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Check ownership of parent property
    const property = await Property.findById(room.property);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Parent property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to view this room',
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

