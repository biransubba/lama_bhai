const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Property = require('../models/Property');
const Room = require('../models/Room');
const { isConfigured, uploadBuffer, deleteAsset } = require('../config/cloudinary');

// Ensure local uploads directory exists for fallback mode
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Helper to save buffer to local disk in development mode
 */
const saveLocally = (file, req) => {
  const extension = path.extname(file.originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${extension}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  const protocol = req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/uploads/${filename}`;

  return {
    url,
    publicId: filename,
    originalName: file.originalname,
    isLocalFallback: true,
  };
};

/**
 * Validates that the authenticated user owns the target property or room before allowing upload
 */
const verifyEntityOwnership = async (req, propertyId, roomId) => {
  if (propertyId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return { status: 400, error: 'Invalid property ID format' };
    }
    const property = await Property.findById(propertyId);
    if (!property) {
      return { status: 404, error: 'Property not found' };
    }
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return {
        status: 403,
        error: 'Access denied: You do not have permission to upload photos for this property',
      };
    }
    return { property };
  }

  if (roomId) {
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return { status: 400, error: 'Invalid room ID format' };
    }
    const room = await Room.findById(roomId);
    if (!room) {
      return { status: 404, error: 'Room not found' };
    }
    const property = await Property.findById(room.property);
    if (!property) {
      return { status: 404, error: 'Parent property for room not found' };
    }
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return {
        status: 403,
        error: 'Access denied: You do not have permission to upload photos for this room',
      };
    }
    return { room, property };
  }

  return {};
};

/**
 * @desc    Upload single image (avatar, property cover, room cover)
 * @route   POST /api/upload/image
 * @access  Private (Authenticated users)
 */
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please attach an image file with key "image"',
      });
    }

    const propertyId = req.body.propertyId || req.query.propertyId;
    const roomId = req.body.roomId || req.query.roomId;

    const check = await verifyEntityOwnership(req, propertyId, roomId);
    if (check.error) {
      return res.status(check.status).json({ success: false, error: check.error });
    }

    const folder = req.body.folder || 'lama-bhaila/properties';

    // 1. Upload to Cloudinary if configured
    if (isConfigured) {
      const result = await uploadBuffer(req.file.buffer, { folder });
      return res.status(200).json({
        success: true,
        message: 'Image uploaded to Cloudinary CDN successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        },
      });
    }

    // 2. Fallback to local static storage
    const localResult = saveLocally(req.file, req);
    return res.status(200).json({
      success: true,
      message: 'Image uploaded to local storage (Cloudinary credentials not configured)',
      data: localResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple gallery images (up to 10)
 * @route   POST /api/upload/gallery
 * @access  Private (Authenticated users)
 */
exports.uploadGallery = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please attach at least one image file with key "images"',
      });
    }

    const propertyId = req.body.propertyId || req.query.propertyId;
    const roomId = req.body.roomId || req.query.roomId;

    const check = await verifyEntityOwnership(req, propertyId, roomId);
    if (check.error) {
      return res.status(check.status).json({ success: false, error: check.error });
    }

    const folder = req.body.folder || 'lama-bhaila/galleries';

    // 1. Process files in parallel
    const uploadPromises = req.files.map(async (file, idx) => {
      if (isConfigured) {
        const result = await uploadBuffer(file.buffer, { folder });
        return {
          id: `gal_${Date.now()}_${idx}`,
          src: result.secure_url,
          alt: file.originalname.replace(/\.[^/.]+$/, ''),
          category: req.body.category || 'Gallery',
          publicId: result.public_id,
        };
      } else {
        const local = saveLocally(file, req);
        return {
          id: `gal_${Date.now()}_${idx}`,
          src: local.url,
          alt: file.originalname.replace(/\.[^/.]+$/, ''),
          category: req.body.category || 'Gallery',
          publicId: local.publicId,
          isLocalFallback: true,
        };
      }
    });

    const uploadedImages = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} gallery photos`,
      count: uploadedImages.length,
      data: uploadedImages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete photo from property / room and Cloudinary / local storage
 * @route   DELETE /api/upload/image
 * @access  Private (Authenticated users)
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { url, publicId, propertyId, roomId } = req.body;

    if (!url && !publicId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either the photo "url" or "publicId" to delete',
      });
    }

    const check = await verifyEntityOwnership(req, propertyId, roomId);
    if (check.error) {
      return res.status(check.status).json({ success: false, error: check.error });
    }

    // If propertyId provided, remove the photo from Property.gallery and Property.image if matching
    if (check.property && propertyId) {
      const property = check.property;
      if (property.image === url) {
        property.image = property.gallery?.[0]?.src || '';
      }
      if (Array.isArray(property.gallery)) {
        property.gallery = property.gallery.filter(
          (g) => g.src !== url && (!publicId || g.publicId !== publicId)
        );
      }
      await property.save();
    }

    // If roomId provided, remove from Room.gallery / Room.image
    if (check.room && roomId) {
      const room = check.room;
      if (room.image === url) {
        room.image = room.gallery?.[0]?.src || '';
      }
      if (Array.isArray(room.gallery)) {
        room.gallery = room.gallery.filter(
          (g) => g.src !== url && (!publicId || g.publicId !== publicId)
        );
      }
      await room.save();
    }

    // Cloudinary deletion if configured and publicId provided
    if (publicId) {
      await deleteAsset(publicId);
    }

    // Local disk deletion if applicable
    if (url && url.includes('/uploads/')) {
      const filename = path.basename(url);
      const localFilePath = path.join(uploadsDir, filename);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (_) {}
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
