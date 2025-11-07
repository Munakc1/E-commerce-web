const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware: require admin
async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.userId || payload.id) || null;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    const role = Array.isArray(rows) && rows[0] ? rows[0].role : null;
    if (String(role || '').toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.adminId = userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

router.get('/summary', requireAdmin, async (_req, res) => {
  try {
    const [[u]] = await pool.query('SELECT COUNT(*) AS users FROM users');
    const [[p]] = await pool.query('SELECT COUNT(*) AS products FROM products');
    const [[o]] = await pool.query('SELECT COUNT(*) AS orders FROM orders');
    // Total sales revenue from orders that are paid or marked sold
    const [[s]] = await pool.query("SELECT COALESCE(SUM(total), 0) AS sales FROM orders WHERE payment_status = 'paid' OR status = 'sold'");
    res.json({ users: u.users || 0, products: p.products || 0, orders: o.orders || 0, sales: s.sales || 0 });
  } catch (e) {
    res.status(500).json({ message: 'Summary failed' });
  }
});

// List all users
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.put('/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body || {};
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  try {
    if (role) await pool.query('UPDATE users SET role = ? WHERE id = ?', [String(role), id]);
    const [rows] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [id]);
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Products (list, update status, delete)
router.get('/products', requireAdmin, async (_req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    const ids = (Array.isArray(products) ? products : []).map(p => p.id);
    if (ids.length === 0) return res.json([]);
    const ph = ids.map(() => '?').join(',');
    const [imgs] = await pool.query(`SELECT product_id, image_url FROM product_images WHERE product_id IN (${ph})`, ids);
    const imgMap = new Map();
    for (const r of (Array.isArray(imgs) ? imgs : [])) {
      if (!imgMap.has(r.product_id)) imgMap.set(r.product_id, []);
      imgMap.get(r.product_id).push(r.image_url);
    }
    const out = (Array.isArray(products) ? products : []).map(p => ({ ...p, images: imgMap.get(p.id) || [] }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.put('/products/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  const { status } = req.body || {};
  try {
    if (status) {
      const map = new Map([
        ['unsold', 'unsold'],
        ['ordered', 'order_received'],
        ['order_received', 'order_received'],
        ['order received', 'order_received'],
        ['sold', 'sold'],
      ]);
      const st = map.get(String(status).toLowerCase().trim()) || 'unsold';
      await pool.query('UPDATE products SET status = ? WHERE id = ?', [st, id]);
    }
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  try {
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Orders (list, update)
router.get('/orders', requireAdmin, async (_req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orderRows = Array.isArray(orders) ? orders : [];
    if (orderRows.length === 0) return res.json([]);
    const ids = orderRows.map(o => o.id);
    const ph = ids.map(() => '?').join(',');
    const [items] = await pool.query(`SELECT * FROM order_items WHERE order_id IN (${ph}) ORDER BY id ASC`, ids);
    const byOrder = new Map();
    for (const it of (Array.isArray(items) ? items : [])) {
      if (!byOrder.has(it.order_id)) byOrder.set(it.order_id, []);
      byOrder.get(it.order_id).push({ id: it.id, product_id: it.product_id, title: it.title, price: it.price, quantity: 1 });
    }
    const out = orderRows.map(o => ({ ...o, items: byOrder.get(o.id) || [] }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.put('/orders/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status, payment_status } = req.body || {};
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (status) {
      // fetch current for audit
      const [[cur]] = await conn.query('SELECT status FROM orders WHERE id = ?', [id]);
      await conn.query('UPDATE orders SET status = ? WHERE id = ?', [String(status), id]);
      try {
        await conn.query('INSERT INTO order_audit_log (order_id, actor_id, field, old_value, new_value) VALUES (?, ?, ?, ?, ?)', [id, req.adminId || null, 'status', cur?.status || null, String(status)]);
      } catch {}
      if (String(status) === 'cancelled') {
        const [items] = await conn.query('SELECT product_id FROM order_items WHERE order_id = ?', [id]);
        const prodIds = (Array.isArray(items) ? items.map(r => Number(r.product_id)).filter(Boolean) : []);
        if (prodIds.length > 0) {
          const ph = prodIds.map(() => '?').join(',');
          await conn.query(`UPDATE products SET status = 'unsold' WHERE id IN (${ph}) AND status = 'order_received'`, prodIds);
        }
      }
    }
    if (payment_status) {
      const [[cur]] = await conn.query('SELECT payment_status FROM orders WHERE id = ?', [id]);
      await conn.query('UPDATE orders SET payment_status = ? WHERE id = ?', [String(payment_status), id]);
      try {
        await conn.query('INSERT INTO order_audit_log (order_id, actor_id, field, old_value, new_value) VALUES (?, ?, ?, ?, ?)', [id, req.adminId || null, 'payment_status', cur?.payment_status || null, String(payment_status)]);
      } catch {}
    }
    await conn.commit();
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const [orderItems] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    res.json({ ...order, items: (Array.isArray(orderItems) ? orderItems : []).map(it => ({ id: it.id, product_id: it.product_id, title: it.title, price: it.price, quantity: 1 })) });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ message: 'Failed to update order' });
  } finally {
    conn.release();
  }
});

// Fetch order audit log
router.get('/orders/:id/audit', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id' });
  try {
    const [rows] = await pool.query('SELECT id, field, old_value, new_value, actor_id, created_at FROM order_audit_log WHERE order_id = ? ORDER BY id DESC', [id]);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch audit log' });
  }
});

module.exports = router;
// --- Admin analytics ---

// Sales analytics: totals and last 30 days time series, plus top products
router.get('/analytics/sales', requireAdmin, async (_req, res) => {
  try {
    const [[totals]] = await pool.query(
      "SELECT\n+         COALESCE(SUM(CASE WHEN payment_status = 'paid' OR status = 'sold' THEN total ELSE 0 END),0) AS totalSales,\n+         COALESCE(SUM(CASE WHEN (payment_status = 'paid' OR status = 'sold') AND DATE(created_at) = CURDATE() THEN total ELSE 0 END),0) AS salesToday,\n+         COUNT(*) AS totalOrders,\n+         SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paidOrders,\n+         SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) AS pendingPayments\n+       FROM orders"
    );

    const [seriesRows] = await pool.query(
      "SELECT DATE(created_at) AS d, COALESCE(SUM(total),0) AS sales\n+       FROM orders\n+       WHERE (payment_status = 'paid' OR status = 'sold')\n+         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)\n+       GROUP BY DATE(created_at)\n+       ORDER BY d ASC"
    );

    const [topProductsRows] = await pool.query(
      "SELECT oi.product_id, oi.title,\n+              COALESCE(SUM(oi.price),0) AS revenue,\n+              COUNT(*) AS qty\n+       FROM order_items oi\n+       JOIN orders o ON o.id = oi.order_id\n+       WHERE (o.payment_status = 'paid' OR o.status = 'sold')\n+       GROUP BY oi.product_id, oi.title\n+       ORDER BY revenue DESC\n+       LIMIT 5"
    );

    const series = Array.isArray(seriesRows)
      ? seriesRows.map(r => ({ date: new Date(r.d).toISOString().slice(0, 10), sales: Number(r.sales || 0) }))
      : [];
    const topProducts = Array.isArray(topProductsRows)
      ? topProductsRows.map(r => ({
          product_id: r.product_id,
          title: r.title,
          revenue: Number(r.revenue || 0),
          qty: Number(r.qty || 0),
        }))
      : [];

    res.json({
      totalSales: Number(totals.totalSales || 0),
      salesToday: Number(totals.salesToday || 0),
      totalOrders: Number(totals.totalOrders || 0),
      paidOrders: Number(totals.paidOrders || 0),
      pendingPayments: Number(totals.pendingPayments || 0),
      salesLast30Days: series,
      topProducts,
    });
  } catch (e) {
    res.status(500).json({ message: 'Analytics failed' });
  }
});
