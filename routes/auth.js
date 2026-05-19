const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { getJwtSecret, requireAuth } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

const allowedRoles = ["user", "pharma_company", "logistics_provider", "auditor_qa", "admin"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user) => ({
  user_id: user._id,
  company_id: user.company_id,
  name: user.name,
  email: user.email,
  role: user.role,
  email_verified: user.email_verified,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const createToken = (user) => jwt.sign(
  {
    user_id: user._id.toString(),
    email: user.email,
    role: user.role,
  },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
);

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const isValidPassword = (password = "") => password.length >= 8;

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
  try {
    const {
      company_id = null,
      email,
      name,
      password,
      role = "user",
    } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ message: "Email format is invalid" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Role is invalid" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      company_id: company_id || null,
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role,
    });
    const token = createToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password_hash");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

// =========================
// CURRENT USER
// =========================
router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: publicUser(req.user),
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
