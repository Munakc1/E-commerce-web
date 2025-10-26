const express = require("express");
const router = express.Router();
const pool = require("../db"); // Server/db.js

// create order (stores snapshot even if product missing)
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
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
      [userId, subtotal, tax, shipping, total, paymentMethod, paymentStatus, JSON.stringify(shippingAddress)]
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

module.exports = router;