// db.js — single shared connection pool to Postgres.
// Every route imports { pool } from here instead of opening its own connection.
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required by Supabase/Neon free tier
});

module.exports = { pool };
