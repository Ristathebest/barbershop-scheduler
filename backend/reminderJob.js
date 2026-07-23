// reminderJob.js — finds bookings starting in ~24 hours and emails a reminder.
const cron = require("node-cron");
const { pool } = require("./db");
const { sendBookingReminder } = require("./email");

// The core logic, exported on its own so we can trigger it manually for testing,
// separate from waiting for the actual schedule.
async function checkAndSendReminders() {
  console.log("Checking for reminder emails to send...");
  const result = await pool.query(
    `SELECT b.*, s.name AS service_name, st.name AS staff_name
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     JOIN staff st ON st.id = b.staff_id
     WHERE b.status = 'confirmed'
       AND b.reminder_sent = false
       AND b.start_time BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'`
  );

  for (const booking of result.rows) {
    await sendBookingReminder({
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      serviceName: booking.service_name,
      staffName: booking.staff_name,
      startTime: booking.start_time,
    });
    await pool.query("UPDATE bookings SET reminder_sent = true WHERE id = $1", [booking.id]);
  }

  return result.rows.length; // how many reminders were sent, useful for testing
}

function startReminderJob() {
  // Runs every 15 minutes, all day, every day.
  cron.schedule("*/15 * * * *", () => {
    checkAndSendReminders().catch((err) => console.error("Reminder job failed:", err));
  });
}

module.exports = { startReminderJob, checkAndSendReminders };