const express = require("express");
const router = express.Router();

// =========================
// REGISTER
// =========================
router.post("/register", (req, res) => {
  const { email, password } = req.body;

  res.json({
    message: "User registered (no DB yet)",
    user: {
      email,
      password,
    },
  });
});

// =========================
// LOGIN
// =========================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  res.json({
    message: "Login successful (no auth)",
    user: {
      email,
    },
  });
});

// =========================
// TEST GET
// =========================
router.get("/test", (req, res) => {
  res.json({
    message: "Auth route working",
  });
});

module.exports = router;