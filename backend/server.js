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

app.listen(3000, () => console.log("Server running on port 3000"));