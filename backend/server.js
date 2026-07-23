// server.js — entry point. Wires up middleware and routes, then starts listening.
const express = require("express");
const cors = require("cors");
const { startReminderJob } = require("./reminderJob");
require("dotenv").config();

const servicesRouter = require("./routes/services");
const staffRouter = require("./routes/staff");
const availabilityRouter = require("./routes/availability");
const bookingsRouter = require("./routes/bookings");
const slotsRouter = require("./routes/slots");
const authRouter = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/services", servicesRouter);
app.use("/api/staff", staffRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/auth", authRouter);
const PORT = process.env.PORT || 4000;
startReminderJob();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});