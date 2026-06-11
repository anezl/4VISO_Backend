const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
  min: { type: Number, default: null },
  max: { type: Number, default: null },
}, { _id: false });

const endpointSchema = new mongoose.Schema({
  city:    { type: String },
  country: { type: String },
  code:    { type: String },
  company: { type: String },
}, { _id: false });

const backupSchema = new mongoose.Schema({
  location:      { type: String },
  company:       { type: String },
  transportType: { type: String },
}, { _id: false });

const nodeSchema = new mongoose.Schema({
  location:           { type: String },
  company:            { type: String },
  type:               { type: String },
  transport:          { type: String },
  certificates:       [{ type: String }],
  validationStatus:   { type: String, enum: ['validated', 'pending', 'not_validated'], default: 'pending' },
  temperatureControl: { type: temperatureSchema, default: null },
  fragile:            { type: Boolean, default: false },
  backups:            [backupSchema],
});

const laneSchema = new mongoose.Schema(
  {
    owner:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:       { type: String, enum: ['draft', 'pending', 'live', 'archived'], default: 'draft' },
    origin:       { type: endpointSchema },
    destination:  { type: endpointSchema },
    cargoProfile: {
      productType:     { type: String },
      weight:          { type: Number },
      dimensions:      { type: String },
      tempRange:       { type: String },
      specialHandling: { type: String },
    },
    nodes:        [nodeSchema],
    riskLevel:    { type: String, enum: ['low', 'medium', 'high'] },
    certificates: [{ type: String }],
    alerts:       [{ type: String }],
    reportStatus: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lane', laneSchema);
