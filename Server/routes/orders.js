const express = require("express");
const router = express.Router();
const pool = require("../db"); // Server/db.js
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

// create order (stores snapshot even if product missing)
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // If JWT is provided, derive userId from token (source of truth)
    let authUserId = null;
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (token && process.env.JWT_SECRET) {
        const payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        authUserId = Number(payload.userId || payload.id) || null;
      }
    } catch {}

    const {
      userId = null,
      items = [],
      subtotal = 0,
      tax = 0,
      shipping = 0,
      total = 0,
      paymentMethod = null,
      paymentStatus = "pending",
      shippingAddress = {},
    } = req.body;

    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, subtotal, tax, shipping, total, payment_method, payment_status, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [authUserId != null ? authUserId : (userId || null), subtotal, tax, shipping, total, paymentMethod, paymentStatus, JSON.stringify(shippingAddress)]
    );

    const orderId = orderResult.insertId;

    if (Array.isArray(items) && items.length > 0) {
      const placeholders = [];
      const params = [];
      for (const it of items) {
        const productId = it.productId || null;
        const title = it.title || it.name || "Unknown";
        const price = Number(it.price || 0);
        const quantity = Number(it.quantity || 1);
        placeholders.push("(?, ?, ?, ?, ?)");
        params.push(orderId, productId, title, price, quantity);
      }
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, title, price, quantity) VALUES ${placeholders.join(", ")}`,
        params
      );
    }

    await conn.commit();
    res.status(201).json({ id: orderId });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    console.error("orders POST error:", err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  } finally {
    conn.release();
  }
});

// optional: list orders (simple)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, 
         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', oi.id, 'product_id', oi.product_id, 'title', oi.title, 'price', oi.price, 'quantity', oi.quantity))
          FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("orders GET error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Get orders placed by the current user (buyer)
router.get('/mine', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const [rows] = await pool.query(
      `SELECT o.*, 
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', oi.id, 'product_id', oi.product_id, 'title', oi.title, 'price', oi.price, 'quantity', oi.quantity))
           FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('orders MINE error:', err);
    res.status(500).json({ message: 'Failed to fetch my orders' });
  }
});

// Get orders that include items from the current user's products (seller)
router.get('/sold', async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    // First, find order ids that have items sold by this user
    const [orderIdRows] = await pool.query(
      `SELECT DISTINCT o.id AS order_id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE p.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );
    const orderIds = Array.isArray(orderIdRows) ? orderIdRows.map(r => r.order_id) : [];
    if (orderIds.length === 0) return res.json([]);

    // Fetch those orders
    const placeholders = orderIds.map(() => '?').join(',');
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE id IN (${placeholders}) ORDER BY created_at DESC`,
      orderIds
    );

    // Fetch only the items from those orders that belong to this seller
    const [itemRows] = await pool.query(
      `SELECT oi.*, p.user_id AS seller_id
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${placeholders}) AND p.user_id = ?`,
      [...orderIds, userId]
    );
    const itemsByOrder = new Map();
    for (const it of Array.isArray(itemRows) ? itemRows : []) {
      if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
      itemsByOrder.get(it.order_id).push({
        id: it.id,
        product_id: it.product_id,
        title: it.title,
        price: it.price,
        quantity: it.quantity,
      });
    }

    const out = (Array.isArray(orders) ? orders : []).map(o => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    })).filter(o => o.items.length > 0);
    res.json(out);
  } catch (err) {
    console.error('orders SOLD error:', err);
    res.status(500).json({ message: 'Failed to fetch sold orders' });
  }
});

module.exports = router;