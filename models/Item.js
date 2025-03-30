const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["lost", "submitted", "received", "claimed", "verified", "rejected"],
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    images: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    foundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedDescription: {
      type: String,
    },
    securityNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    token: {
      type: String,
    },
    tokenVerifiedAt: {
      type: Date,
    },
    questions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Item", itemSchema);
