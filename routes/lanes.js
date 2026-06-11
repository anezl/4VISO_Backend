const express = require('express');
const router = express.Router();
const Lane = require('../models/Lane');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Recalculate a lane's risk from its intermediary nodes and their backups.
// Rule: no stops = high, every stop has ≥1 backup = low, some stops backed up = medium, none = high.
function computeRiskLevel(nodes = []) {
  if (!nodes || nodes.length <= 2) return 'high';
  const intermediaries = nodes.slice(1, -1);
  if (intermediaries.every(n => n.backups && n.backups.length > 0)) return 'low';
  if (intermediaries.some(n => n.backups && n.backups.length > 0)) return 'medium';
  return 'high';
}

// POST /lanes — create a new lane
router.post('/', async (req, res) => {
  try {
    const lane = new Lane({
      ...req.body,
      owner: req.user._id,
      status: 'draft'
    });
    lane.riskLevel = computeRiskLevel(lane.nodes);
    await lane.save();
    res.status(201).json(lane);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /lanes — get all lanes for logged-in user
// Supports ?status=draft|pending|live|archived and ?riskLevel=low|medium|high
router.get('/', async (req, res) => {
  try {
    const filter = { owner: req.user._id };
    const validStatuses  = ['draft', 'pending', 'live', 'archived'];
    const validRiskLevels = ['low', 'medium', 'high'];
    if (req.query.status    && validStatuses.includes(req.query.status))
      filter.status    = req.query.status;
    if (req.query.riskLevel && validRiskLevels.includes(req.query.riskLevel))
      filter.riskLevel = req.query.riskLevel;
    const lanes = await Lane.find(filter).sort({ createdAt: -1 });
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
    const lane = await Lane.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lane) return res.status(404).json({ error: 'Lane not found' });

    // Never let the client overwrite these.
    const { owner, _id, __v, ...allowedFields } = req.body;
    Object.assign(lane, allowedFields);

    // Always recompute risk from the final node list.
    lane.riskLevel = computeRiskLevel(lane.nodes);

    await lane.save();
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

// POST /lanes/:id/report — owner submits the lane for review
router.post('/:id/report', async (req, res) => {
  try {
    const lane = await Lane.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lane) return res.status(404).json({ error: 'Lane not found' });
    lane.status = 'pending';
    lane.reportStatus = 'pending';
    await lane.save();
    res.json(lane);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /lanes/:id/approve — admin approves a submitted lane
router.post('/:id/approve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const lane = await Lane.findById(req.params.id);
    if (!lane) return res.status(404).json({ error: 'Lane not found' });
    lane.status = 'live';
    lane.reportStatus = 'live';
    await lane.save();
    res.json(lane);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;