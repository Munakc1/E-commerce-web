// Server/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ← Add this
const pool = require("../db"); // Using CommonJS now

const router = express.Router();

// ---------------- Signup ----------------
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  if (!email.includes("@"))
    return res.status(400).json({ error: "Invalid email format" });

  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    // Check if email already exists
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({ 
      success: true, 
      message: "Account created successfully",
      token,
      user: { id: result.insertId, name, email }
    });

  } catch (err) {
    console.error("Signup error:", err);
    
    // MySQL duplicate entry error (backup check)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email is already registered" });
    }

    return res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// ---------------- Login ----------------
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  if (!email.includes("@"))
    return res.status(400).json({ error: "Invalid email format" });

  try {
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    
    if (users.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) 
      return res.status(401).json({ error: "Invalid email or password" });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      success: true, 
      message: "Login successful", 
      token,
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (err) {
    console.error("SignIn error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

module.exports = router;
