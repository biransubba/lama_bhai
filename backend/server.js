const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// 1. Load environment variables from .env file
dotenv.config();

// 2. Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:1234";

// 3. Connect to Database
connectDB().catch((err) => {
  console.error("Initial MongoDB connection failed. Server will continue with degraded DB status:", err.message);
});

// 4. Foundational Middleware
// Logging incoming HTTP requests for development visibility
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// CORS (Cross-Origin Resource Sharing)
// Allows our React frontend (running on Parcel, port 1234) to communicate with this server
// "credentials: true" is crucial: it permits the browser to send & receive session cookies
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Body parsers: converts incoming JSON strings and url-encoded forms into req.body objects
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Base & Health Check Route
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: "ok",
    message: "Lama Bhaila Tourism Backend is running smoothly!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: isDbConnected ? "connected" : "disconnected",
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
  });
});

// Root welcome endpoint
app.get("/", (req, res) => {
  res.send("Welcome to Lama Bhaila Tourism API. Health check available at /api/health");
});

// 6. 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Route Not Found",
    path: req.originalUrl,
  });
});

// 7. Centralized Error Handler Middleware
// When any route passes an error to next(err), it gets handled here
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// 8. Start listening for incoming network requests
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Lama Bhaila Tourism Server is running!`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(` Client URL allowed: ${CLIENT_URL}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

module.exports = { app, server };

