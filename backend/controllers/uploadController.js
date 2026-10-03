const fs = require('fs');
const path = require('path');
const { isConfigured, uploadBuffer } = require('../config/cloudinary');

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
 * @desc    Upload single image (avatar, property cover, destination image)
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
