const cloudinary = require('cloudinary').v2;
const streamifier = require('stream');

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_KEY &&
  process.env.CLOUDINARY_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
  });
  console.log('Cloudinary CDN integration enabled.');
} else {
  console.log('Cloudinary credentials not detected in .env. Operating with local static fallback storage.');
}

/**
 * Upload an in-memory buffer to Cloudinary via stream
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options (e.g. folder, transformation)
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'lama-bhaila',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadBuffer,
};
