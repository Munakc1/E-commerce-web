const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

function getUserId(req) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return Number(payload.userId || payload.id) || null;
  } catch { return null; }
}

// Submit feedback about a seller after purchase
router.post('/feedback', async (req, res) => {
  try {
    const buyerId = getUserId(req);
    if (!buyerId) return res.status(401).json({ message: 'Unauthorized' });
    const { orderId, as_described, rating, comment, sellerId } = req.body || {};
    const oid = Number(orderId);
    if (!oid) return res.status(400).json({ message: 'orderId required' });

    // verify order belongs to buyer
    const [[ord]] = await pool.query('SELECT id, user_id, status, payment_status FROM orders WHERE id = ? LIMIT 1', [oid]);
    if (!ord || Number(ord.user_id) !== buyerId) return res.status(403).json({ message: 'Forbidden' });

    // derive seller_id from seller_sales; if ambiguous, require sellerId param
    const [rows] = await pool.query('SELECT DISTINCT seller_id FROM seller_sales WHERE order_id = ?', [oid]);
    const sellers = Array.isArray(rows) ? rows.map(r => Number(r.seller_id)).filter(Boolean) : [];
    let sid = Number(sellerId || 0);
    if (sellers.length === 1) sid = sellers[0];
    if (!sid && sellers.length > 1) return res.status(400).json({ message: 'Multiple sellers in order; specify sellerId' });
    if (!sid) return res.status(400).json({ message: 'Unable to resolve seller' });

    const asDesc = String(as_described) === '0' || as_described === false ? 0 : 1;
    const rate = rating == null || rating === '' ? null : Math.max(1, Math.min(5, Number(rating)));

    // prevent duplicates
    const [[exists]] = await pool.query('SELECT id FROM seller_feedback WHERE order_id = ? AND buyer_id = ? AND seller_id = ? LIMIT 1', [oid, buyerId, sid]);
    if (exists) return res.status(409).json({ message: 'Feedback already submitted' });

    await pool.query('INSERT INTO seller_feedback (order_id, seller_id, buyer_id, as_described, rating, comment) VALUES (?, ?, ?, ?, ?, ?)', [oid, sid, buyerId, asDesc, rate, comment || null]);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('feedback submit error:', e);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Seller feedback summary
router.get('/:id/feedback/summary', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const [[agg]] = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN as_described = 1 THEN 1 ELSE 0 END) as positives,
              AVG(NULLIF(rating,0)) as avgRating
       FROM seller_feedback WHERE seller_id = ?`, [id]
    );
    const total = Number(agg?.total || 0);
    const positives = Number(agg?.positives || 0);
    const avgRating = agg?.avgRating != null ? Number(agg.avgRating) : null;
    const percentage = total > 0 ? Math.round((positives / total) * 100) : 0;
    // recent comments
    const [recent] = await pool.query('SELECT comment, as_described, rating, created_at FROM seller_feedback WHERE seller_id = ? AND comment IS NOT NULL ORDER BY id DESC LIMIT 5', [id]);
    res.json({ seller_id: id, total, positives, percentage, avgRating, recent: Array.isArray(recent) ? recent : [] });
  } catch (e) {
    res.status(500).json({ message: 'Summary failed' });
  }
});

// List feedback (optional, paginated later)
router.get('/:id/feedback', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const [rows] = await pool.query('SELECT order_id, buyer_id, as_described, rating, comment, created_at FROM seller_feedback WHERE seller_id = ? ORDER BY id DESC LIMIT 50', [id]);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.status(500).json({ message: 'List failed' });
  }
});

module.exports = router;
