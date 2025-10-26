const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads dir
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB per file

// POST /api/products (multipart/form-data with field "images")
router.post('/', upload.array('images', 8), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      title,
      price = 0,
      originalPrice = null,
      brand = null,
      size = null,
      productCondition = null,
      seller = null,
      location = null,
    } = req.body || {};

    if (!title) return res.status(400).json({ message: 'title required' });

    await conn.beginTransaction();

    // insert product (only columns that exist in your table)
    const [productResult] = await conn.query(
      `INSERT INTO products
        (title, price, originalPrice, brand, size, productCondition, seller, location, image, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, price, originalPrice, brand, size, productCondition, seller, location, null]
    );
    const productId = productResult.insertId;

    // save uploaded files to product_images and set first image on products.image
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      // insert rows into product_images
      const placeholders = files.map(() => '(?, ?)').join(', ');
      const params = files.flatMap(f => [productId, `${baseUrl}/uploads/${f.filename}`]);
      await conn.query(
        `INSERT INTO product_images (product_id, image_url) VALUES ${placeholders}`,
        params
      );

      // update products.image with first image URL (optional)
      const firstUrl = `${baseUrl}/uploads/${files[0].filename}`;
      await conn.query(`UPDATE products SET image = ? WHERE id = ?`, [firstUrl, productId]);
    }

    await conn.commit();
    res.status(201).json({ id: productId });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    console.error('products POST error:', err);
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
