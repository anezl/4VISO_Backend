const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// routes
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/companies", companyRoutes);

module.exports = app;
