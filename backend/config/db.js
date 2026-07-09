const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query("SELECT NOW()");

    console.log("✅ Connected to Supabase PostgreSQL!");
    console.log("Server time:", result.rows[0].now);

  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL");
    console.error(err);

    process.exit(1);
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  pool,
  testConnection,
};