const express = require('express');
const router = express.Router();
const Lane = require('../models/Lane');

// POST /lanes — create a new lane
router.post('/', async (req, res) => {
  try {
    const lane = new Lane({
      ...req.body,
      owner: req.user._id,
      companyName: req.user.companyName,
      status: 'draft'
    });
    await lane.save();
    res.status(201).json(lane);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /lanes — get all lanes for logged-in user
router.get('/', async (req, res) => {
  try {
    const lanes = await Lane.find({ owner: req.user._id });
    res.json(lanes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /lanes/:id — get a single lane
router.get('/:id', async (req, res) => {
  try {
    const lane = await Lane.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lane) return res.status(404).json({ error: 'Lane not found' });
    res.json(lane);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /lanes/:id — update a lane
router.put('/:id', async (req, res) => {
  try {
    const lane = await Lane.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!lane) return res.status(404).json({ error: 'Lane not found' });
    res.json(lane);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /lanes/:id — delete a lane
router.delete('/:id', async (req, res) => {
  try {
    const lane = await Lane.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!lane) return res.status(404).json({ error: 'Lane not found' });
    res.json({ message: 'Lane deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;