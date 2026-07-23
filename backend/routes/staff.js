// routes/staff.js — CRUD for staff members. Same pattern as services.js.
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/staff — list all staff
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM staff ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// POST /api/staff — add a new staff member
router.post("/", requireAuth, async (req, res) => {
  const { name, email } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO staff (name, email) VALUES ($1, $2) RETURNING *",
      [name, email || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});
// DELETE /api/staff/:id — admin only
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM staff WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.json({ message: "Staff member deleted" });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Cannot delete: this staff member has existing bookings" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});
// PATCH /api/staff/:id — update any combination of name, email, active (admin only)
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, email, active } = req.body;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(email);
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
      `UPDATE staff SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});
module.exports = router;