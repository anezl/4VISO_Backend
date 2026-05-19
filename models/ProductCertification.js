const mongoose = require("mongoose");

const productCertificationSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    certification_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certification",
      required: true,
    },
  },
  {
    collection: "product_certifications",
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        returnedObject.product_certification_id = returnedObject._id;
        delete returnedObject._id;
        delete returnedObject.__v;
      },
    },
  },
);

productCertificationSchema.index(
  { product_id: 1, certification_id: 1 },
  { unique: true },
);

module.exports = mongoose.model("ProductCertification", productCertificationSchema);
