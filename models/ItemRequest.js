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
    requestedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "verified", "verification_failed", "cancelled"],
      default: "pending",
    },
    answers: [
      {
        question: {
          type: String,
        },
        answer: {
          type: String,
        },
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
    preferredContactMethod: {
      type: String,
      enum: ["email", "phone"],
      default: "email",
    },
    appointmentTimeSlot: {
      type: String,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
