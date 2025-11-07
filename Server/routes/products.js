const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const notify = require('../utils/notify');
const poolMain = pool;
// const { sendMail } = require('../config/mailer'); // email optional, using in-app messages instead

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

// helper: extract local filename from absolute image URL
function filenameFromUrl(url) {
  try {
    const idx = String(url).lastIndexOf('/uploads/');
    if (idx === -1) return null;
    return String(url).slice(idx + '/uploads/'.length);
  } catch {
    return null;
  }
}

// helper: ensure category exists and return id; accepts name or id
async function resolveCategoryId(conn, { categoryId, categoryName }) {
  try {
    if (categoryId) {
      const idNum = Number(categoryId);
      if (idNum > 0) return idNum;
    }
    const name = (categoryName || '').trim();
    if (!name) return null;
    const slug = String(name)
      .toLowerCase()
      .trim()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) return null;
    const [existing] = await conn.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug]);
    if (Array.isArray(existing) && existing[0]) return existing[0].id;
    const [ins] = await conn.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
    return ins.insertId || null;
  } catch {
    return null;
  }
}

// helper: auth and ownership
async function requireOwner(req, res, productId) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
    return null;
  }
  const userId = Number(payload.userId || payload.id) || null;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  const [rows] = await pool.query('SELECT id, user_id FROM products WHERE id = ?', [productId]);
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(404).json({ message: 'Product not found' });
    return null;
  }
  const product = rows[0];
  if (Number(product.user_id) !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  return { userId, product };
}

// GET /api/products - list products with images (compatible with older MySQL/MariaDB)
router.get('/', async (req, res) => {
  try {
    const { verified } = req.query;
    const verifiedOnly = String(verified || '').toLowerCase() === 'true';
    // Fetch products with seller verification flag joined from users
    const [products] = await pool.query(
      `SELECT p.*, u.is_verified_seller FROM products p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    if (!Array.isArray(products) || products.length === 0) {
      return res.json([]);
    }
    // Optionally filter by verified sellers
    const filtered = verifiedOnly ? products.filter(p => Number(p.is_verified_seller) === 1) : products;
    const ids = filtered.map(p => p.id);
    if (ids.length === 0) return res.json([]);
    const placeholders = ids.map(() => '?').join(',');
    const [imgRows] = await pool.query(
      `SELECT product_id, image_url FROM product_images WHERE product_id IN (${placeholders})`,
      ids
    );
    const imgMap = new Map();
    if (Array.isArray(imgRows)) {
      for (const r of imgRows) {
        if (!imgMap.has(r.product_id)) imgMap.set(r.product_id, []);
        imgMap.get(r.product_id).push(r.image_url);
      }
    }
    const out = filtered.map(p => ({ ...p, sellerId: p.user_id || null, is_verified_seller: Number(p.is_verified_seller) === 1, images: imgMap.get(p.id) || [] }));
    return res.json(out);
  } catch (err) {
    console.error('products GET error:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// GET /api/products/mine - list products for current user
router.get('/mine', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const userId = Number(payload.userId || payload.id) || null;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const [products] = await pool.query(
      `SELECT p.*, u.is_verified_seller FROM products p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      [userId]
    );
    if (!Array.isArray(products) || products.length === 0) {
      return res.json([]);
    }
    const ids = products.map(p => p.id);
    const placeholders = ids.map(() => '?').join(',');
    const [imgRows] = await pool.query(
      `SELECT product_id, image_url FROM product_images WHERE product_id IN (${placeholders})`,
      ids
    );
    const imgMap = new Map();
    if (Array.isArray(imgRows)) {
      for (const r of imgRows) {
        if (!imgMap.has(r.product_id)) imgMap.set(r.product_id, []);
        imgMap.get(r.product_id).push(r.image_url);
      }
    }
    const out = products.map(p => ({ ...p, sellerId: p.user_id || null, is_verified_seller: Number(p.is_verified_seller) === 1, images: imgMap.get(p.id) || [] }));
    return res.json(out);
  } catch (err) {
    console.error('products MINE GET error:', err);
    res.status(500).json({ message: 'Failed to fetch my products' });
  }
});

// GET /api/products/:id - single product detail with images
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const [products] = await pool.query(
      `SELECT p.*, u.is_verified_seller FROM products p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    if (!Array.isArray(products) || products.length === 0) return res.status(404).json({ message: 'Product not found' });
    const product = products[0];
    const [imgs] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
    const images = Array.isArray(imgs) ? imgs.map(r => r.image_url) : [];
    res.json({ ...product, sellerId: product.user_id || null, is_verified_seller: Number(product.is_verified_seller) === 1, images });
  } catch (err) {
    console.error('product detail GET error:', err);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// POST /api/products (multipart/form-data with field "images")
router.post('/', upload.array('images', 8), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      title,
      price = 0,
      originalPrice = null,
      brand = null,
      category = null,
      categoryId = null,
      size = null,
      productCondition = null,
      location = null,
    } = req.body || {};

    if (!title) return res.status(400).json({ message: 'title required' });

    // Require JWT and derive userId strictly from token (do not accept from body)
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const userId = Number(payload.userId || payload.id) || null;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch seller details from users table (immutable source of truth)
    const [urows] = await pool.query('SELECT name, phone FROM users WHERE id = ?', [userId]);
    const sellerRow = Array.isArray(urows) && urows[0] ? urows[0] : null;
    if (!sellerRow) return res.status(400).json({ message: 'Seller not found' });
    const finalSeller = sellerRow.name;
    const finalPhone = sellerRow.phone || null;

    await conn.beginTransaction();

    // resolve category id (optional)
    const catId = await resolveCategoryId(conn, { categoryId, categoryName: category });

    // insert product (only columns that exist in your table)
    const [productResult] = await conn.query(
      `INSERT INTO products
        (title, price, originalPrice, brand, category, category_id, size, productCondition, seller, phone, location, image, created_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [title, price, originalPrice, brand, category, catId, size, productCondition, finalSeller, finalPhone, location, null, userId]
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

// PUT /api/products/:id - update listing (metadata JSON or multipart to add/replace images)
router.put('/:id', upload.array('images', 8), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  const owner = await requireOwner(req, res, id);
  if (!owner) return; // response already sent

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Build dynamic update for provided fields
    const allowedFields = {
      title: v => v,
      price: v => (v === undefined || v === null || v === '' ? undefined : Number(v)),
      originalPrice: v => (v === undefined || v === null || v === '' ? null : Number(v)),
      brand: v => (v === undefined ? undefined : (v || null)),
      category: v => (v === undefined ? undefined : (v || null)),
      category_id: v => (v === undefined || v === '' ? undefined : (v === null ? null : Number(v))),
      size: v => (v === undefined ? undefined : (v || null)),
      productCondition: v => (v === undefined ? undefined : (v || null)),
      location: v => (v === undefined ? undefined : (v || null)),
      status: v => {
        if (v === undefined) return undefined;
        const str = String(v).toLowerCase().trim();
        const map = new Map([
          ['unsold', 'unsold'],
          ['ordered', 'order_received'],
          ['order_received', 'order_received'],
          ['order received', 'order_received'],
          ['sold', 'sold'],
        ]);
        return map.get(str) || 'unsold';
      },
    };

    const sets = [];
    const params = [];
    for (const key of Object.keys(allowedFields)) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const val = allowedFields[key](req.body[key]);
        if (val !== undefined) {
          sets.push(`${key} = ?`);
          params.push(val);
        }
      }
    }
    // If categoryId or category provided specially, compute category_id
    if (Object.prototype.hasOwnProperty.call(req.body, 'categoryId') && !Object.prototype.hasOwnProperty.call(req.body, 'category_id')) {
      const cid = await resolveCategoryId(conn, { categoryId: req.body.categoryId, categoryName: undefined });
      if (cid !== null) {
        sets.push('category_id = ?');
        params.push(cid);
      }
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'category') && !Object.prototype.hasOwnProperty.call(req.body, 'category_id')) {
      const cid = await resolveCategoryId(conn, { categoryId: undefined, categoryName: req.body.category });
      if (cid !== null) {
        sets.push('category_id = ?');
        params.push(cid);
      }
    }

    if (sets.length > 0) {
      params.push(id);
      await conn.query(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, params);
    }

    // Handle images
    const files = Array.isArray(req.files) ? req.files : [];
    const replaceImages = String(req.body.replaceImages || '').toLowerCase();
    const shouldReplace = replaceImages === 'true' || replaceImages === '1';

    if (shouldReplace) {
      // delete existing image files and rows
      const [oldImgs] = await conn.query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
      if (Array.isArray(oldImgs)) {
        for (const r of oldImgs) {
          const fname = filenameFromUrl(r.image_url);
          if (fname) {
            const fpath = path.join(UPLOAD_DIR, fname);
            try { if (fs.existsSync(fpath)) fs.unlinkSync(fpath); } catch {}
          }
        }
      }
      await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
      // also clear main image
      await conn.query('UPDATE products SET image = NULL WHERE id = ?', [id]);
    }

    if (files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const placeholders = files.map(() => '(?, ?)').join(', ');
      const params2 = files.flatMap(f => [id, `${baseUrl}/uploads/${f.filename}`]);
      await conn.query(`INSERT INTO product_images (product_id, image_url) VALUES ${placeholders}`, params2);

      // if replacing, or if product has no main image, set main image to first new file
      const firstUrl = `${baseUrl}/uploads/${files[0].filename}`;
      if (shouldReplace) {
        await conn.query('UPDATE products SET image = ? WHERE id = ?', [firstUrl, id]);
      } else {
        const [prow] = await conn.query('SELECT image FROM products WHERE id = ?', [id]);
        const cur = Array.isArray(prow) && prow[0] ? prow[0].image : null;
        if (!cur) await conn.query('UPDATE products SET image = ? WHERE id = ?', [firstUrl, id]);
      }
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    console.error('products PUT error:', err);
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/products/:id - delete listing and its images (owner only)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  const owner = await requireOwner(req, res, id);
  if (!owner) return; // response already sent

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // collect images to delete files
    const [imgs] = await conn.query('SELECT image_url FROM product_images WHERE product_id = ?', [id]);
    if (Array.isArray(imgs)) {
      for (const r of imgs) {
        const fname = filenameFromUrl(r.image_url);
        if (fname) {
          const fpath = path.join(UPLOAD_DIR, fname);
          try { if (fs.existsSync(fpath)) fs.unlinkSync(fpath); } catch {}
        }
      }
    }

    await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    await conn.query('DELETE FROM products WHERE id = ?', [id]);

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    console.error('products DELETE error:', err);
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  } finally {
    conn.release();
  }
});

// Contact seller about a product (create in-app message + notification)
router.post('/:id/message', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const { name, message } = req.body || {};
    if (!message || String(message).trim().length < 2) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Derive sender from JWT if present (optional, anonymous allowed)
    let senderId = null;
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token && process.env.JWT_SECRET) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        senderId = Number(payload.userId || payload.id) || null;
      } catch { /* ignore */ }
    }

    // Fetch product and seller
    const [prows] = await pool.query('SELECT id, title, user_id FROM products WHERE id = ?', [id]);
    if (!Array.isArray(prows) || prows.length === 0) return res.status(404).json({ message: 'Product not found' });
    const product = prows[0];
    if (!product.user_id) return res.status(400).json({ message: 'Seller not linked to product' });
    const recipientId = Number(product.user_id);

    // Insert message
    await pool.query(
      'INSERT INTO messages (product_id, sender_id, recipient_id, content) VALUES (?, ?, ?, ?)',
      [product.id, senderId, recipientId, String(message).trim()]
    );

    // Create notification for seller
    const payload = JSON.stringify({ productId: product.id, title: product.title, from: name || null, preview: String(message).slice(0, 120) });
    const [nres] = await pool.query(
      'INSERT INTO notifications (user_id, type, payload) VALUES (?, ?, ?)',
      [recipientId, 'message', payload]
    );
    if (nres && nres.insertId) {
      try {
        const [nrows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [nres.insertId]);
        if (Array.isArray(nrows) && nrows[0]) {
          notify.send(recipientId, 'notification', nrows[0]);
        }
      } catch {}
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('product message POST error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

module.exports = router;
