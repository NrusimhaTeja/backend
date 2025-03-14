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
    uniqueMarks: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["lost", "submitted", "received", "claimed", "rejected"],
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
    questions: [
      {
        question: {
          type: String,
        },
        answer: {
          type: String,
        },
      },
    ],
    foundBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    securityNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
    tokenUsed: {
      type: Boolean,
      default: false,
    },
    tokenVerifiedAt: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Item", itemSchema);