const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to extract userId from Bearer token
function getUserIdFromToken(req) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.userId || payload.id) || null;
    return userId;
  } catch (e) {
    return null;
  }
}

router.put('/me', async (req, res) => {
  let { id, name, phone } = req.body || {};

  // Prefer user id from JWT when available
  const tokenUserId = getUserIdFromToken(req);
  if (tokenUserId) id = tokenUserId;

  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await pool.query(`UPDATE users SET name = ?, phone = ? WHERE id = ?`, [name ?? null, phone ?? null, id]);
    const [rows] = await pool.query(`SELECT id, name, email, phone, role, is_verified_seller, seller_tier, created_at FROM users WHERE id = ?`, [id]);
    return res.json({ user: rows[0] || null });
  } catch (e) {
    console.error('PUT /api/users/me error:', e);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;

// Return current user profile
router.get('/me', async (req, res) => {
  const id = getUserIdFromToken(req);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [rows] = await pool.query(`SELECT id, name, email, phone, role, is_verified_seller, seller_tier, created_at FROM users WHERE id = ?`, [id]);
    return res.json({ user: rows[0] || null });
  } catch (e) {
    console.error('GET /api/users/me error:', e);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  let { id, oldPassword, newPassword, currentPassword } = req.body || {};

  // Support client naming: currentPassword vs oldPassword
  if (!oldPassword && currentPassword) oldPassword = currentPassword;

  // If id not provided, try to extract from Authorization: Bearer <token>
  if (!id) {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (token && process.env.JWT_SECRET) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload && (payload.userId || payload.id)) {
          id = payload.userId || payload.id;
        }
      }
    } catch (e) {
      // ignore token errors, will fall back to validation below
    }
  }

  if (!id || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'id, currentPassword/oldPassword and newPassword are required' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  try {
    const [rows] = await pool.query('SELECT id, password FROM users WHERE id = ?', [id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(String(oldPassword), String(user.password));
    if (!isMatch) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }
    const hashed = await bcrypt.hash(String(newPassword), 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error('POST /api/users/change-password error:', e);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});