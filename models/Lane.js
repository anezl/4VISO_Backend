const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  location: { type: String },
  company: { type: String },
  transportType: { type: String },
  isBackup: { type: Boolean, default: false }
});

const laneSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String },
    status: {
      type: String,
      enum: ['draft', 'pending', 'live', 'archived'],
      default: 'draft'
    },
    origin: { type: String },
    destination: { type: String },
    cargoProfile: {
      productType: { type: String },
      weight: { type: Number },
      dimensions: { type: String },
      tempRange: { type: String },
      specialHandling: { type: String }
    },
    nodes: [nodeSchema],
    riskLevel: { type: String },
    certificates: [{ type: String }],
    alerts: [{ type: String }],
    reportStatus: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lane', laneSchema);