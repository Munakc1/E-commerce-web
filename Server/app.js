// Server/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// File upload and cloudinary
const multer = require("multer");
const cloudinary = require("./config/cloudinary"); // Make sure cloudinary.js exports correctly

// Database connection
const pool = require("./db");

// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");



const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
