// email.js — wraps Resend so route files don't need to know API details directly.
const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendBookingConfirmation({ clientName, clientEmail, serviceName, staffName, startTime }) {
  const formattedTime = new Date(startTime).toUTCString();

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: clientEmail,
      subject: "Your appointment is confirmed",
      html: `
        <p>Hi ${clientName},</p>
        <p>Your <strong>${serviceName}</strong> appointment with <strong>${staffName}</strong> is confirmed for:</p>
        <p><strong>${formattedTime}</strong></p>
        <p>See you then!</p>
      `,
    });
  } catch (err) {
    // Deliberately not re-thrown: a failed email shouldn't undo an already-successful booking.
    console.error("Failed to send confirmation email:", err);
  }
}
async function sendBookingReminder({ clientName, clientEmail, serviceName, staffName, startTime }) {
  const formattedTime = new Date(startTime).toUTCString();

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: clientEmail,
      subject: "Reminder: your appointment is tomorrow",
      html: `
        <p>Hi ${clientName},</p>
        <p>Just a reminder — your <strong>${serviceName}</strong> appointment with <strong>${staffName}</strong> is coming up:</p>
        <p><strong>${formattedTime}</strong></p>
        <p>See you soon!</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send reminder email:", err);
  }
}
module.exports = { sendBookingConfirmation, sendBookingReminder };