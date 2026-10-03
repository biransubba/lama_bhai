const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const connectDB = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

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

// 5. Session Middleware (Persistent via MongoDB)
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lama-bhaila";
app.use(
  session({
    secret: process.env.SESSION_SECRET || "lama_bhaila_dev_session_secret_btech_2026",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    }),
    cookie: {
      httpOnly: true, // Prevents client-side scripts from reading the cookie (anti-XSS)
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    },
  })
);

// 6. Passport.js Authentication Engine
app.use(passport.initialize());
app.use(passport.session());

// 7. Base & Health Check Route
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

// 8. Application API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/owner", ownerRoutes);

// 9. 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Route Not Found",
    path: req.originalUrl,
  });
});

// 10. Centralized Error Handler Middleware
// When any route passes an error to next(err), it gets handled here
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// 11. Start listening for incoming network requests
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Lama Bhaila Tourism Server is running!`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(` Client URL allowed: ${CLIENT_URL}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`===============================================`);
});

module.exports = { app, server };


