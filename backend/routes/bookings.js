// routes/bookings.js — client appointments.
const express = require("express");
const { pool } = require("../db");
const requireAuth = require("../middleware/requireAuth");
const { sendBookingConfirmation } = require("../email");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const { staff_id } = req.query;
  try {
    const result = staff_id
      ? await pool.query("SELECT * FROM bookings WHERE staff_id = $1 ORDER BY start_time", [staff_id])
      : await pool.query("SELECT * FROM bookings ORDER BY start_time");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.post("/", async (req, res) => {
  const { client_name, client_email, service_id, staff_id, start_time, end_time } = req.body;
  if (!client_name || !client_email || !service_id || !staff_id || !start_time || !end_time) {
    return res.status(400).json({ error: "client_name, client_email, service_id, staff_id, start_time, end_time are required" });
  }

  if (new Date(start_time) < new Date()) {
    return res.status(400).json({ error: "Cannot book a time in the past" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (client_name, client_email, service_id, staff_id, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [client_name, client_email, service_id, staff_id, start_time, end_time]
    );
    const booking = result.rows[0];

    // Look up the human-readable names for the email — the booking row only stores IDs.
    const [serviceResult, staffResult] = await Promise.all([
      pool.query("SELECT name FROM services WHERE id = $1", [service_id]),
      pool.query("SELECT name FROM staff WHERE id = $1", [staff_id]),
    ]);

    await sendBookingConfirmation({
      clientName: client_name,
      clientEmail: client_email,
      serviceName: serviceResult.rows[0]?.name || "your service",
      staffName: staffResult.rows[0]?.name || "our team",
      startTime: booking.start_time,
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, start_time, end_time } = req.body;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
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
    return res.status(400).json({ error: "Provide at least one of status, start_time, end_time" });
  }

  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE bookings SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});
const { checkAndSendReminders } = require("../reminderJob"); // add this near the top imports too

// POST /api/bookings/send-reminders-now — admin-only, manually triggers the reminder check
router.post("/send-reminders-now", requireAuth, async (req, res) => {
  try {
    const count = await checkAndSendReminders();
    res.json({ message: `Checked and sent ${count} reminder(s)` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reminders" });
  }
});

module.exports = router;