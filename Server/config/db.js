import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3308,   // 👈 add this line
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Muna#12",
  database: process.env.DB_NAME || "thriftydb",
});

export default pool;
