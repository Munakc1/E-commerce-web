const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDb() {
  const {
    DB_HOST = 'localhost',
    DB_PORT = 3306,
    DB_USER = 'root',
    DB_PASS = '',
    DB_NAME = 'thriftsydb',
  } = process.env;

  // Ensure database exists
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS || '',
    multipleStatements: true,
  });
  await conn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await conn.end();

  // Ensure tables exist
  const pool = require('../db');
  // Helper: ensure a column exists on a table (additive only)
  async function ensureColumn(table, columnDef, afterColumn) {
    const colName = columnDef.split(/\s+/)[0];
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [colName]);
      if (Array.isArray(cols) && cols.length > 0) return; // already exists
      const after = afterColumn ? ` AFTER \`${afterColumn}\`` : '';
      await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN ${columnDef}${after}`);
    } catch (e) {
      console.error(`Failed ensuring column ${table}.${colName}:`, e);
    }
  }
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      phone VARCHAR(20) NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // Categories (normalized taxonomy)
    `CREATE TABLE IF NOT EXISTS categories (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      parent_id INT UNSIGNED NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS products (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NULL,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      originalPrice DECIMAL(10,2),
      brand VARCHAR(100),
      size VARCHAR(50),
      productCondition VARCHAR(50),
      seller VARCHAR(100),
      phone VARCHAR(20) NULL,
      location VARCHAR(100),
      image VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT fk_products_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS product_images (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_id INT UNSIGNED NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    /* NEW: orders and order_items */
    `CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      tax DECIMAL(12,2) NOT NULL,
      shipping DECIMAL(12,2) NOT NULL,
      total DECIMAL(12,2) NOT NULL,
      payment_method VARCHAR(50),
      payment_status VARCHAR(50) DEFAULT 'pending',
      shipping_address JSON,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      order_id INT UNSIGNED NOT NULL,
      product_id INT UNSIGNED NULL,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      quantity INT NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // Messages (in-app)
    `CREATE TABLE IF NOT EXISTS messages (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_id INT UNSIGNED NOT NULL,
      sender_id INT UNSIGNED NULL,
      recipient_id INT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_messages_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // Notifications (simple)
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      type VARCHAR(50) NOT NULL,
      payload JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      PRIMARY KEY (id),
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  ];

  for (const sql of statements) {
    try {
      await pool.execute(sql);
    } catch (err) {
      console.error('Failed running statement:', err);
    }
  }
  // Ensure backward compatibility: add missing columns for existing databases
  await ensureColumn('users', 'phone VARCHAR(20) NULL', 'email');
  await ensureColumn('products', 'phone VARCHAR(20) NULL', 'seller');
  await ensureColumn('products', 'user_id INT UNSIGNED NULL', 'id');
  await ensureColumn('products', 'category VARCHAR(50) NULL', 'size');
  await ensureColumn('products', 'category_id INT UNSIGNED NULL', 'category');

  // Ensure foreign key exists for products.user_id -> users.id
  try {
    const [fkRows] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'user_id'
         AND REFERENCED_TABLE_NAME = 'users' AND REFERENCED_COLUMN_NAME = 'id'`,
      [DB_NAME]
    );
    if (!Array.isArray(fkRows) || fkRows.length === 0) {
      // Add FK with a stable name; ignore if it already exists under a different name
      try {
        await pool.execute(
          'ALTER TABLE `products` ADD CONSTRAINT `fk_products_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL'
        );
      } catch (e) {
        // If it fails due to existing constraint name, ignore
        if (!(e && (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_CANT_CREATE_TABLE'))) {
          console.warn('FK add warning products.user_id -> users.id:', e && e.message ? e.message : e);
        }
      }
    }
  } catch (e) {
    console.warn('FK check warning for products.user_id:', e && e.message ? e.message : e);
  }

  // Ensure foreign key exists for products.category_id -> categories.id
  try {
    const [fkRows2] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'category_id'
         AND REFERENCED_TABLE_NAME = 'categories' AND REFERENCED_COLUMN_NAME = 'id'`,
      [DB_NAME]
    );
    if (!Array.isArray(fkRows2) || fkRows2.length === 0) {
      try {
        await pool.execute(
          'ALTER TABLE `products` ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL'
        );
      } catch (e) {
        if (!(e && (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_CANT_CREATE_TABLE'))) {
          console.warn('FK add warning products.category_id -> categories.id:', e && e.message ? e.message : e);
        }
      }
    }
  } catch (e) {
    console.warn('FK check warning for products.category_id:', e && e.message ? e.message : e);
  }

  // Backfill categories table and link products.category_id
  try {
    // helper slugify
    const slugify = (str) => String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const [distinctCats] = await pool.query(
      `SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> ''`
    );
    const catRows = Array.isArray(distinctCats) ? distinctCats : [];
    for (const row of catRows) {
      const name = row.category;
      const slug = slugify(name);
      if (!slug) continue;
      // insert if not exists
      const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
      let catId = (Array.isArray(existing) && existing[0]) ? existing[0].id : null;
      if (!catId) {
        const [ins] = await pool.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
        catId = ins.insertId;
      }
      // link products by case-insensitive match
      await pool.query('UPDATE products SET category_id = ? WHERE category_id IS NULL AND LOWER(category) = LOWER(?)', [catId, name]);
    }
  } catch (e) {
    console.warn('Backfill categories warning:', e && e.message ? e.message : e);
  }
  console.log('✅ Database and tables are ready');
}

module.exports = initDb;

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}