// routes/availability.js — working hours per staff member, per day of week.
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/availability?staff_id=1 — get availability, optionally filtered by staff
router.get("/", async (req, res) => {
  const { staff_id } = req.query;
  try {
    const result = staff_id
      ? await pool.query("SELECT * FROM availability WHERE staff_id = $1 ORDER BY day_of_week", [staff_id])
      : await pool.query("SELECT * FROM availability ORDER BY staff_id, day_of_week");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// POST /api/availability — add a working-hours block for a staff member
router.post("/", requireAuth, async (req, res) => {
  const { staff_id, day_of_week, start_time, end_time } = req.body;
  if (staff_id == null || day_of_week == null || !start_time || !end_time) {
    return res.status(400).json({ error: "staff_id, day_of_week, start_time, end_time are required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO availability (staff_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *",
      [staff_id, day_of_week, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create availability" });
  }
});
// DELETE /api/availability/:id — admin only
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM availability WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Availability entry not found" });
    }
    res.json({ message: "Availability entry deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete availability entry" });
  }
});

// PATCH /api/availability/:id — edit day/start/end (admin only)
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { day_of_week, start_time, end_time } = req.body;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (day_of_week !== undefined) {
    fields.push(`day_of_week = $${paramIndex++}`);
    values.push(day_of_week);
  }
  if (start_time !== undefined) {
    fields.push(`start_time = $${paramIndex++}`);
    values.push(start_time);
  }
  if (end_time !== undefined) {
    fields.push(`end_time = $${paramIndex++}`);
    values.push(end_time);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "Provide at least one field to update" });
  }

  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE availability SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Availability entry not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update availability entry" });
  }
});

module.exports = router;