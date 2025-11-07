const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Reuse uploads directory
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Simple storage (filenames only)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB per doc

// Helper: derive user id from bearer token
function getUserId(req) {
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

// Middleware: require auth
function requireAuth(req, res, next) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  req.userId = userId;
  next();
}

// Middleware: require admin
async function requireAdmin(req, res, next) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const [[row]] = await pool.query('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
    const role = row ? String(row.role || '').toLowerCase() : '';
    if (role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.adminId = userId;
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Role check failed' });
  }
}

// POST /api/sellers/verify/apply - create/update application
router.post('/verify/apply', requireAuth, upload.array('documents', 5), async (req, res) => {
  try {
    const userId = req.userId;
    const { shop_name } = req.body || {};
    const files = Array.isArray(req.files) ? req.files : [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const docPaths = files.map(f => `${baseUrl}/uploads/${f.filename}`);

    // fetch existing application
    const [existing] = await pool.query('SELECT id, status FROM seller_verifications WHERE user_id = ? LIMIT 1', [userId]);
    if (Array.isArray(existing) && existing[0]) {
      const row = existing[0];
      // If already approved, do not allow modifying
      if (String(row.status) === 'approved') {
        return res.status(400).json({ message: 'Already verified' });
      }
      // update existing (reset status to pending if previously rejected)
      await pool.query('UPDATE seller_verifications SET shop_name = ?, documents = ?, status = ?, notes = NULL WHERE id = ?', [shop_name || null, JSON.stringify(docPaths), 'pending', row.id]);
      return res.json({ ok: true, updated: true });
    }
    // create new application
    await pool.query('INSERT INTO seller_verifications (user_id, shop_name, documents) VALUES (?, ?, ?)', [userId, shop_name || null, JSON.stringify(docPaths)]);
    res.status(201).json({ ok: true, created: true });
  } catch (e) {
    console.error('apply verification error:', e);
    res.status(500).json({ message: 'Failed to apply' });
  }
});

// GET /api/sellers/:id/status - public seller verification status
router.get('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const [[userRow]] = await pool.query('SELECT id, is_verified_seller, seller_tier FROM users WHERE id = ? LIMIT 1', [id]);
    if (!userRow) return res.status(404).json({ message: 'User not found' });
    const [appRows] = await pool.query('SELECT id, status, shop_name, documents, notes, decided_at, decided_by, created_at, updated_at FROM seller_verifications WHERE user_id = ? LIMIT 1', [id]);
    const app = Array.isArray(appRows) && appRows[0] ? appRows[0] : null;
    res.json({ user_id: id, is_verified_seller: Number(userRow.is_verified_seller) === 1, seller_tier: userRow.seller_tier || null, application: app });
  } catch (e) {
    res.status(500).json({ message: 'Status fetch failed' });
  }
});

// GET /api/admin/sellers/pending - list pending applications
router.get('/admin/sellers/pending', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sv.id AS application_id, sv.user_id, sv.shop_name, sv.status, sv.documents, sv.created_at, u.name, u.email, u.is_verified_seller
       FROM seller_verifications sv
       JOIN users u ON sv.user_id = u.id
       WHERE sv.status = 'pending'
       ORDER BY sv.created_at ASC`
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.status(500).json({ message: 'Failed to list pending applications' });
  }
});

// PUT /api/admin/sellers/:id/approve - approve seller
router.put('/admin/sellers/:id/approve', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const { notes, tier } = req.body || {};
    await pool.query('UPDATE seller_verifications SET status = "approved", notes = ?, decided_by = ?, decided_at = NOW() WHERE user_id = ?', [notes || null, req.adminId || null, id]);
    await pool.query('UPDATE users SET is_verified_seller = 1, seller_tier = ? WHERE id = ?', [tier || null, id]);
    const [[row]] = await pool.query('SELECT id, is_verified_seller, seller_tier FROM users WHERE id = ? LIMIT 1', [id]);
    res.json({ ok: true, user: row });
  } catch (e) {
    res.status(500).json({ message: 'Approve failed' });
  }
});

// PUT /api/admin/sellers/:id/reject - reject seller
router.put('/admin/sellers/:id/reject', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const { notes } = req.body || {};
    await pool.query('UPDATE seller_verifications SET status = "rejected", notes = ?, decided_by = ?, decided_at = NOW() WHERE user_id = ?', [notes || null, req.adminId || null, id]);
    // ensure user flag is not set
    await pool.query('UPDATE users SET is_verified_seller = 0 WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Reject failed' });
  }
});

module.exports = router;