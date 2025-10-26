const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/categories - list all categories ordered by name
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, slug, parent_id FROM categories ORDER BY name ASC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    console.error('categories GET error:', e);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

module.exports = router;
