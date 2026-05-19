const mongoose = require("mongoose");

const roles = ["user", "pharma_company", "logistics_provider", "auditor_qa", "admin"];

const userSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: roles,
      default: "user",
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    verification_token: {
      type: String,
      default: null,
      select: false,
    },
    reset_token: {
      type: String,
      default: null,
      select: false,
    },
    reset_token_expires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    collection: "users",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        returnedObject.user_id = returnedObject._id;
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.password_hash;
        delete returnedObject.verification_token;
        delete returnedObject.reset_token;
        delete returnedObject.reset_token_expires;
      },
    },
  },
);

module.exports = mongoose.model("User", userSchema);
