const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const notify = require('../utils/notify');

function getUserId(req) {
  // Allow token via header or query (for SSE EventSource which can't set headers)
  const auth = req.headers.authorization || '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token && req.query && req.query.token) token = String(req.query.token);
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    const id = Number(p.userId || p.id) || null;
    return id;
  } catch {
    return null;
  }
}

// GET /api/messages - list messages for current user (inbox & sent)
router.get('/messages', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const [rows] = await pool.query(
      `SELECT m.*, p.title AS product_title
       FROM messages m
       LEFT JOIN products p ON p.id = m.product_id
       WHERE m.recipient_id = ? OR m.sender_id = ?
       ORDER BY m.created_at DESC
       LIMIT 200`,
      [userId, userId]
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    console.error('messages GET error:', e);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// GET /api/notifications - latest notifications for current user
router.get('/notifications', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    console.error('notifications GET error:', e);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/mark-read - mark notifications as read
router.post('/notifications/mark-read', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length) return res.json({ ok: true });
  try {
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND id IN (${placeholders})`,
      [userId, ...ids]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('notifications mark-read error:', e);
    res.status(500).json({ message: 'Failed to mark notifications read' });
  }
});

module.exports = router;
router.post('/messages/reply', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { productId, toUserId, content } = req.body || {};
  const pid = Number(productId);
  const toId = Number(toUserId);
  if (!pid || !toId) return res.status(400).json({ message: 'Invalid product or recipient' });
  if (!content || String(content).trim().length < 1) return res.status(400).json({ message: 'Message content required' });
  try {
    // Optional: verify product exists
    const [prows] = await pool.query('SELECT id, title FROM products WHERE id = ?', [pid]);
    if (!Array.isArray(prows) || prows.length === 0) return res.status(404).json({ message: 'Product not found' });
    const product = prows[0];
    // Insert message
    await pool.query(
      'INSERT INTO messages (product_id, sender_id, recipient_id, content) VALUES (?, ?, ?, ?)',
      [pid, userId, toId, String(content).trim()]
    );
    // Create notification for recipient
    const payload = JSON.stringify({ productId: pid, title: product.title, fromUserId: userId, preview: String(content).slice(0, 120) });
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, payload) VALUES (?, ?, ?)',
      [toId, 'message', payload]
    );
    // Fetch inserted row to send via SSE
    if (result && result.insertId) {
      const [nrows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
      if (Array.isArray(nrows) && nrows[0]) {
        notify.send(toId, 'notification', nrows[0]);
      }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('messages reply POST error:', e);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

// SSE stream for notifications: GET /api/notifications/stream?token=...
router.get('/notifications/stream', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).end();
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Allow CORS if needed (cors middleware already global)
  res.flushHeaders && res.flushHeaders();

  // Send a hello event
  res.write(`event: hello\n`);
  res.write(`data: {"ok":true}\n\n`);

  // Register client
  notify.addClient(userId, res);

  // Optional: send current unread count
  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
    const initial = Array.isArray(rows) ? rows : [];
    res.write(`event: bootstrap\n`);
    res.write(`data: ${JSON.stringify(initial)}\n\n`);
  } catch {}

  const onClose = () => {
    notify.removeClient(userId, res);
    try { res.end(); } catch {}
  };
  req.on('close', onClose);
  req.on('end', onClose);
});
