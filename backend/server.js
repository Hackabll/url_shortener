require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const limiter = require("./middleware/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const urlRoutes = require("./routes/urlRoutes");
const redirectRoutes = require("./routes/redirectRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const qrRoutes = require("./routes/qrRoutes");
const db = require("./config/db");

db.query("SELECT 1", (err) => {
  if (err) {
    console.error("DB CONNECT ERROR:", err);
  } else {
    console.log("DB CONNECTED SUCCESSFULLY ✅");
  }
});
const app = express();
app.use(express.static(path.join(__dirname, "../frontend")));

app.use(express.json());
app.use(cors());
app.use(limiter);

app.use("/api", authRoutes);     
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/qrcode", qrRoutes);
app.use("/", redirectRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));