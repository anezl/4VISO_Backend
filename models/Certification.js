const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    collection: "certifications",
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        returnedObject.certification_id = returnedObject._id;
        delete returnedObject._id;
        delete returnedObject.__v;
      },
    },
  },
);

module.exports = mongoose.model("Certification", certificationSchema);
