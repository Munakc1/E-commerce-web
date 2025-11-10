const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

function requireUser(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.userId || payload.id) || null;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return null;
    }
    return userId;
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
    return null;
  }
}

// GET /api/reviews/product/:id -> list reviews and average
router.get('/product/:id', async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) return res.status(400).json({ message: 'Invalid product id' });
  try {
    const [rows] = await pool.query('SELECT r.id, r.user_id, u.name as user_name, r.rating, r.comment, r.created_at FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.product_id = ? ORDER BY r.id DESC', [productId]);
    const [[avgRow]] = await pool.query('SELECT COALESCE(AVG(rating),0) AS avgRating, COUNT(*) AS count FROM reviews WHERE product_id = ?', [productId]);
    res.json({ reviews: Array.isArray(rows) ? rows : [], avgRating: Number(avgRow?.avgRating || 0), count: Number(avgRow?.count || 0) });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews -> { productId, rating (1..5), comment }
router.post('/', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { productId, rating, comment } = req.body || {};
  const pid = Number(productId);
  const r = Number(rating);
  if (!pid || !r || r < 1 || r > 5) return res.status(400).json({ message: 'Invalid input' });
  try {
    // Upsert: one review per user per product
    const [[existing]] = await pool.query('SELECT id FROM reviews WHERE product_id = ? AND user_id = ? LIMIT 1', [pid, userId]);
    if (existing && existing.id) {
      await pool.query('UPDATE reviews SET rating = ?, comment = ?, created_at = NOW() WHERE id = ?', [r, comment || null, existing.id]);
      return res.json({ id: existing.id, updated: true });
    }
    const [ins] = await pool.query('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', [pid, userId, r, comment || null]);
    res.status(201).json({ id: ins.insertId });
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

module.exports = router;
