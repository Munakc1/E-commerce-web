// Server/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3308,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Muna#12",
  database: process.env.DB_NAME || "thriftydb",
});

module.exports = pool;
