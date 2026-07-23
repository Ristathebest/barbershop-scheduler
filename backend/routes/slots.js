// routes/slots.js — computes available booking slots for a staff member/service/date.
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

const SLOT_INTERVAL_MINUTES = 15;

// GET /api/slots?staff_id=1&service_id=1&date=2026-07-27
router.get("/", async (req, res) => {
  const { staff_id, service_id, date } = req.query;
  if (!staff_id || !service_id || !date) {
    return res.status(400).json({ error: "staff_id, service_id, and date are required" });
  }

  try {
    // 1. How long does this service take?
    const serviceResult = await pool.query(
      "SELECT duration_minutes FROM services WHERE id = $1",
      [service_id]
    );
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    const durationMinutes = serviceResult.rows[0].duration_minutes;

    // 2. What day of week is this date? (0 = Sunday ... 6 = Saturday)
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

    // 3. Staff working hours for that day
    const availResult = await pool.query(
      "SELECT start_time, end_time FROM availability WHERE staff_id = $1 AND day_of_week = $2",
      [staff_id, dayOfWeek]
    );
    if (availResult.rows.length === 0) {
      return res.json({ slots: [] }); // staff doesn't work this day at all
    }

    // 4. Existing bookings for that staff member on that date
    const bookingsResult = await pool.query(
      `SELECT start_time, end_time FROM bookings
       WHERE staff_id = $1 AND status != 'cancelled' AND start_time::date = $2::date`,
      [staff_id, date]
    );
    const existingBookings = bookingsResult.rows.map((b) => ({
      start: new Date(b.start_time),
      end: new Date(b.end_time),
    }));

    // 5. Walk through working hours in 15-minute steps, collecting valid slots
    const availableSlots = [];

    for (const block of availResult.rows) {
      let slotStart = new Date(`${date}T${block.start_time}Z`);
      const workEnd = new Date(`${date}T${block.end_time}Z`);

      while (true) {
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
        if (slotEnd > workEnd) break; // not enough time left before closing

        const overlaps = existingBookings.some(
          (b) => slotStart < b.end && slotEnd > b.start
        );

        if (!overlaps) {
          availableSlots.push(slotStart.toISOString());
        }

        slotStart = new Date(slotStart.getTime() + SLOT_INTERVAL_MINUTES * 60000);
      }
    }

    res.json({ slots: availableSlots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute available slots" });
  }
});

module.exports = router;