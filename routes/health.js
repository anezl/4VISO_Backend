const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const databaseStatuses = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

router.get("/", (req, res) => {
  const databaseStatus = databaseStatuses[mongoose.connection.readyState] || "unknown";

  res.json({
    status: "ok",
    service: "4VISO Backend API",
    database: {
      status: databaseStatus,
      name: mongoose.connection.name || null,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
