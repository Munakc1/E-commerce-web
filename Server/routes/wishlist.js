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

// GET /api/wishlist -> list product ids in user's wishlist
router.get('/', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const [rows] = await pool.query('SELECT product_id FROM wishlist_items WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const ids = Array.isArray(rows) ? rows.map(r => String(r.product_id)) : [];
    res.json(ids);
  } catch (err) {
    console.error('wishlist GET error:', err);
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist { productId }
router.post('/', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { productId } = req.body || {};
  const pid = Number(productId);
  if (!pid) return res.status(400).json({ message: 'Invalid productId' });
  try {
    await pool.query('INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)', [userId, pid]);
    res.json({ ok: true });
  } catch (err) {
    console.error('wishlist POST error:', err);
    res.status(500).json({ message: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const pid = Number(req.params.productId);
  if (!pid) return res.status(400).json({ message: 'Invalid productId' });
  try {
    await pool.query('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?', [userId, pid]);
    res.json({ ok: true });
  } catch (err) {
    console.error('wishlist DELETE error:', err);
    res.status(500).json({ message: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
