const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const notify = require('../utils/notify');

// Helpers
function getUserIdFromAuth(req) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return Number(payload.userId || payload.id) || null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const uid = getUserIdFromAuth(req);
  if (!uid) return res.status(401).json({ message: 'Unauthorized' });
  req.userId = uid;
  next();
}

// GET /api/notifications - list recent notifications for the user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const [rows] = await pool.query(
      'SELECT id, user_id, type, payload, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50',
      [userId]
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load notifications' });
  }
});

// POST /api/notifications/mark-read - mark one or more notifications as read
router.post('/mark-read', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (ids.length === 0) return res.json({ ok: true, updated: 0 });
    const ph = ids.map(() => '?').join(',');
    const sql = `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND id IN (${ph})`;
    const [result] = await pool.query(sql, [userId, ...ids]);
    res.json({ ok: true, updated: result.affectedRows || 0 });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark read' });
  }
});

// GET /api/notifications/stream - SSE stream for real-time notifications
router.get('/stream', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token || !process.env.JWT_SECRET) return res.status(401).end();
    let userId = null;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      userId = Number(payload.userId || payload.id) || null;
    } catch {
      return res.status(401).end();
    }
    if (!userId) return res.status(401).end();

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send a bootstrap payload of recent notifications
    try {
      const [rows] = await pool.query(
        'SELECT id, user_id, type, payload, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 10',
        [userId]
      );
      const list = Array.isArray(rows) ? rows : [];
      res.write(`event: bootstrap\n`);
      res.write(`data: ${JSON.stringify(list)}\n\n`);
    } catch {}

    // Register client
    notify.addClient(userId, res);
    req.on('close', () => {
      try { notify.removeClient(userId, res); } catch {}
    });
  } catch {
    // Avoid noisy errors on SSE disconnects
    try { res.end(); } catch {}
  }
});

module.exports = router;