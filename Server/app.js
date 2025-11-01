// Server/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const initDb = require("./config/initDb"); 
const path = require("path");


// Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const orderRoutes = require("./routes/orders");
const messageRoutes = require("./routes/messages");
const categoriesRoutes = require("./routes/categories");
const wishlistRoutes = require("./routes/wishlist");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
// Keep CORS simple and before all routes to avoid preflight issues in dev
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static: serve uploaded files (for product images)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ===== Routes =====
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Simple health check for quick verification
app.get('/_health', (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", messageRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ===== Start server with database initialization =====
// ← Replace app.listen() with this async wrapper
(async () => {
  try {
    await initDb(); // Initialize database and tables
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  }
})();
