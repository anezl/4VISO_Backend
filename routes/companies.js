const express = require("express");
const mongoose = require("mongoose");

const { requireAuth } = require("../middleware/auth");
const Company = require("../models/Company");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email = "") => {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail || null;
};

const publicCompany = (company) => ({
  company_id: company._id,
  name: company.name,
  email: company.email,
  location: company.location,
  contact: company.contact,
  created_at: company.created_at,
  updated_at: company.updated_at,
});

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/", requireAuth, async (req, res) => {
  const companies = await Company.find().sort({ name: 1 });

  res.json({
    companies: companies.map(publicCompany),
  });
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      contact = "",
      email = "",
      location = "",
      name,
    } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Company name is required" });
    }

    if (normalizedEmail && !emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ message: "Company email format is invalid" });
    }

    if (normalizedEmail) {
      const existingCompany = await Company.findOne({ email: normalizedEmail });

      if (existingCompany) {
        return res.status(409).json({ message: "A company with this email already exists" });
      }
    }

    const company = await Company.create({
      contact,
      email: normalizedEmail,
      location,
      name,
    });

    return res.status(201).json({
      message: "Company created successfully",
      company: publicCompany(company),
    });
  } catch (error) {
    return res.status(500).json({ message: "Company creation failed" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Company id is invalid" });
  }

  const company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  return res.json({ company: publicCompany(company) });
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Company id is invalid" });
    }

    const {
      contact,
      email,
      location,
      name,
    } = req.body;
    const update = {};

    if (typeof name === "string") {
      if (!name.trim()) {
        return res.status(400).json({ message: "Company name cannot be empty" });
      }

      update.name = name;
    }

    if (typeof email === "string") {
      const normalizedEmail = normalizeEmail(email);

      if (normalizedEmail && !emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: "Company email format is invalid" });
      }

      if (normalizedEmail) {
        const existingCompany = await Company.findOne({
          _id: { $ne: req.params.id },
          email: normalizedEmail,
        });

        if (existingCompany) {
          return res.status(409).json({ message: "A company with this email already exists" });
        }
      }

      update.email = normalizedEmail;
    }

    if (typeof location === "string") {
      update.location = location;
    }

    if (typeof contact === "string") {
      update.contact = contact;
    }

    const company = await Company.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.json({
      message: "Company updated successfully",
      company: publicCompany(company),
    });
  } catch (error) {
    return res.status(500).json({ message: "Company update failed" });
  }
});

module.exports = router;
