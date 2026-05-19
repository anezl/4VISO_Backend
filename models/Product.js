const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    pharma_type: {
      type: String,
      required: true,
      trim: true,
    },
    temp_min: {
      type: Number,
      required: true,
    },
    temp_max: {
      type: Number,
      required: true,
    },
    specifications: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    collection: "products",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        returnedObject.product_id = returnedObject._id;
        delete returnedObject._id;
        delete returnedObject.__v;
      },
    },
  },
);

module.exports = mongoose.model("Product", productSchema);
