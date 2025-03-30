const mongoose = require("mongoose");

const itemRequestSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["claim"],
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    answers: [
      {
        type: String,
      },
    ],
    proofImages: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    additionalNotes: {
      type: String,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    verificationNotes: {
      type: String,
    },
    verificationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ItemRequest", itemRequestSchema);
