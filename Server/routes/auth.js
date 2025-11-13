// Server/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ← Add this
const pool = require("../db"); // Using CommonJS now
const crypto = require('crypto');
const { sendMail } = require('../config/mailer');

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
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const [urows] = await pool.execute(
      "SELECT id, name, email, phone, role, is_verified_seller, seller_tier FROM users WHERE id = ?",
      [result.insertId]
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
  user: { id: result.insertId, name: urows[0]?.name || name, email: urows[0]?.email || email, phone: urows[0]?.phone || null, role: urows[0]?.role || 'user', is_verified_seller: urows[0]?.is_verified_seller === 1, seller_tier: urows[0]?.seller_tier || null }
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

    // Return user with role
  const [urows] = await pool.execute("SELECT id, name, email, phone, role, is_verified_seller, seller_tier FROM users WHERE id = ?", [user.id]);

    res.json({ 
      success: true, 
      message: "Login successful", 
      token,
  user: { id: urows[0]?.id || user.id, name: urows[0]?.name || user.name, email: urows[0]?.email || user.email, phone: urows[0]?.phone || null, role: urows[0]?.role || 'user', is_verified_seller: urows[0]?.is_verified_seller === 1, seller_tier: urows[0]?.seller_tier || null } 
    });
  } catch (err) {
    console.error("SignIn error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

module.exports = router;
// ---------------- Forgot Password ----------------
router.post('/forgot', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !String(email).includes('@')) return res.status(400).json({ error: 'Valid email required' });
  try {
    const [rows] = await pool.query('SELECT id, email, name FROM users WHERE email = ? LIMIT 1', [email]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.json({ success: true, message: 'If that account exists, a reset link has been created.' });
    }
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id]);
    const clientBase = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
    const resetLink = `${clientBase}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'Password Reset',
        text: `Hello ${user.name || ''},\nUse the link to reset your password: ${resetLink}\nThis link expires in 1 hour.`,
        html: `<p>Hello ${user.name || ''},</p><p><a href="${resetLink}" target="_blank" rel="noopener">Reset your password</a>. Link expires in 1 hour.</p>`
      });
    } catch (e) {
      console.warn('Mail send failed (fallback logging).', e && e.message ? e.message : e);
    }
    res.json({ success: true, message: 'Reset link generated. Check email (or console in dev).' });
  } catch (e) {
    console.error('forgot error', e);
    res.status(500).json({ error: 'Failed to create reset link' });
  }
});

// ---------------- Reset Password ----------------
router.post('/reset', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'token and password required' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const [rows] = await pool.query('SELECT id, reset_token_expires FROM users WHERE reset_token = ? LIMIT 1', [token]);
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const user = rows[0];
    const exp = user.reset_token_expires ? new Date(user.reset_token_expires) : null;
    if (!exp || exp.getTime() < Date.now()) {
      // Expired: clear token
      await pool.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [user.id]);
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashed, user.id]);
    res.json({ success: true, message: 'Password updated. You can now sign in.' });
  } catch (e) {
    console.error('reset error', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});
