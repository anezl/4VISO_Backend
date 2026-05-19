const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    contact: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    collection: "companies",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        returnedObject.company_id = returnedObject._id;
        delete returnedObject._id;
        delete returnedObject.__v;
      },
    },
  },
);

companySchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Company", companySchema);
