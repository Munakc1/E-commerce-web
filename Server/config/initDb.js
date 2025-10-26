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

    `CREATE TABLE IF NOT EXISTS products (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      originalPrice DECIMAL(10,2),
      brand VARCHAR(100),
      size VARCHAR(50),
      productCondition VARCHAR(50),
      seller VARCHAR(100),
      location VARCHAR(100),
      image VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
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
  ];

  for (const sql of statements) {
    try {
      await pool.execute(sql);
    } catch (err) {
      console.error('Failed running statement:', err);
    }
  }
  // Ensure backward compatibility: add phone column if the table already existed
  try {
    await pool.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER email`);
  } catch (err) {
    // Some MySQL versions may not support IF NOT EXISTS for ADD COLUMN; fallback check
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
      try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'phone'`);
        if (!Array.isArray(cols) || cols.length === 0) {
          await pool.execute(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER email`);
        }
      } catch (e) {
        console.error('Failed ensuring users.phone column:', e);
      }
    }
  }
  console.log('✅ Database and tables are ready');
}

module.exports = initDb;

// Allow manual run: npm run db:init
if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}