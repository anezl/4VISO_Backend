const express = require("express");
const mongoose = require("mongoose");

const { requireAuth } = require("../middleware/auth");
const Certification = require("../models/Certification");

const router = express.Router();

const publicCertification = (certification) => ({
  certification_id: certification._id,
  code: certification.code,
  name: certification.name,
  description: certification.description,
});

const normalizeCode = (code = "") => code.trim().toUpperCase();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/", requireAuth, async (req, res) => {
  const certifications = await Certification.find().sort({ code: 1 });

  res.json({
    certifications: certifications.map(publicCertification),
  });
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      code,
      description = "",
      name,
    } = req.body;
    const normalizedCode = normalizeCode(code);

    if (!normalizedCode || !name || !name.trim()) {
      return res.status(400).json({ message: "Certification code and name are required" });
    }

    const existingCertification = await Certification.findOne({ code: normalizedCode });

    if (existingCertification) {
      return res.status(409).json({ message: "A certification with this code already exists" });
    }

    const certification = await Certification.create({
      code: normalizedCode,
      description,
      name,
    });

    return res.status(201).json({
      message: "Certification created successfully",
      certification: publicCertification(certification),
    });
  } catch (error) {
    return res.status(500).json({ message: "Certification creation failed" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Certification id is invalid" });
  }

  const certification = await Certification.findById(req.params.id);

  if (!certification) {
    return res.status(404).json({ message: "Certification not found" });
  }

  return res.json({ certification: publicCertification(certification) });
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Certification id is invalid" });
    }

    const {
      code,
      description,
      name,
    } = req.body;
    const update = {};

    if (typeof code === "string") {
      const normalizedCode = normalizeCode(code);

      if (!normalizedCode) {
        return res.status(400).json({ message: "Certification code cannot be empty" });
      }

      const existingCertification = await Certification.findOne({
        _id: { $ne: req.params.id },
        code: normalizedCode,
      });

      if (existingCertification) {
        return res.status(409).json({ message: "A certification with this code already exists" });
      }

      update.code = normalizedCode;
    }

    if (typeof name === "string") {
      if (!name.trim()) {
        return res.status(400).json({ message: "Certification name cannot be empty" });
      }

      update.name = name;
    }

    if (typeof description === "string") {
      update.description = description;
    }

    const certification = await Certification.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }

    return res.json({
      message: "Certification updated successfully",
      certification: publicCertification(certification),
    });
  } catch (error) {
    return res.status(500).json({ message: "Certification update failed" });
  }
});

module.exports = router;
