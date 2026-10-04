const multer = require('multer');

// Memory storage keeps file buffers in memory for direct piping to Cloudinary or disk
const storage = multer.memoryStorage();

// File filter restricting uploads to valid image formats
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format (${file.mimetype}). Please upload JPG, PNG, WEBP, or AVIF images.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes limit per file
  },
  fileFilter,
});

/**
 * Higher-order middleware to capture Multer errors and format 413 / 400 responses
 */
const handleMulterUpload = (multerAction) => (req, res, next) => {
  multerAction(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'File too large. Maximum file size allowed is 5MB.',
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: `Unexpected upload field: ${err.field}. Please use the expected file input key.`,
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        error: err.message || 'File upload validation failed',
      });
    }
    next();
  });
};

module.exports = {
  uploadSingle: handleMulterUpload(upload.single('image')),
  uploadMultiple: handleMulterUpload(upload.array('images', 10)), // Max 10 images at once
};
