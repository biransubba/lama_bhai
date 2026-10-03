const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Reads MONGO_URI from environment variables with fallback to local instance.
 */
const connectDB = async () => {
  const mongoURI =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lama-bhaila';

  try {
    const conn = await mongoose.connect(mongoURI, {
      // Modern mongoose defaults are optimal; timeout options provide rapid feedback
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // In development, log the tip for running MongoDB locally or providing Atlas URI
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Tip: Ensure your local MongoDB service is running (net start MongoDB) or specify a valid MONGO_URI in backend/.env'
      );
    }
    throw error;
  }
};

// Monitor connection events for runtime health checks
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB runtime connection error: ${err.message}`);
});

module.exports = connectDB;
