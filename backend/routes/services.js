// routes/services.js — CRUD for the "services" table (haircut, beard trim, etc.)
// This is deliberately the first and simplest route — a template for the rest.
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/services — list all services
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM services ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// POST /api/services — create a new service
router.post("/", requireAuth, async (req, res) => {
  const { name, price, duration_minutes } = req.body;
  if (!name || !price || !duration_minutes) {
    return res.status(400).json({ error: "name, price, and duration_minutes are required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO services (name, price, duration_minutes) VALUES ($1, $2, $3) RETURNING *",
      [name, price, duration_minutes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create service" });
  }
});
// DELETE /api/services/:id — admin only
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM services WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service deleted" });
  } catch (err) {
    // Postgres error code 23503 = foreign key violation — this service has existing bookings.
    if (err.code === "23503") {
      return res.status(409).json({ error: "Cannot delete: this service has existing bookings" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete service" });
  }
});
// PATCH /api/services/:id — update any combination of name, price, duration, active (admin only)
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, price, duration_minutes, active } = req.body;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (price !== undefined) {
    fields.push(`price = $${paramIndex++}`);
    values.push(price);
  }
  if (duration_minutes !== undefined) {
    fields.push(`duration_minutes = $${paramIndex++}`);
    values.push(duration_minutes);
  }
  if (active !== undefined) {
    fields.push(`active = $${paramIndex++}`);
    values.push(active);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "Provide at least one field to update" });
  }

  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE services SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update service" });
  }
});
module.exports = router;
