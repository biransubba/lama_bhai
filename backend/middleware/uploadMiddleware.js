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

module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 10), // Max 10 images at once
};
