// app.js
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const userRoutes = require("./routes/userRoutes");

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: "https://findit-frontend.vercel.app",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
