const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const userAuth = require("../utils/userAuth");
const roleAuth = require("../utils/roleAuth");
const { upload } = require("../config/cloudinary");


// Report lost item
router.post(
  "/report/lost",
  userAuth,
  upload.array("images", 5),
  itemController.reportLostItem
);

// Report found item
router.post(
  "/report/found",
  userAuth,
  upload.array("images", 5),
  itemController.reportFoundItem
);

// Review item (security guard)
router.put(
  "/:id/review",
  userAuth,
  roleAuth(["securityGuard"]),
  itemController.reviewItem
);

// Claim item
router.post(
  "/:id/claim",
  userAuth,
  upload.array("proofImages", 3),
  itemController.claimItem
);

// Verify claim (security officer)
router.put(
  "/claim/:id/verify",
  userAuth,
  roleAuth(["securityOfficer"]),
  itemController.verifyClaim
);

// Get item by token
router.get(
  "/token/:token",
  userAuth,
  roleAuth(["securityGuard", "securityOfficer"]),
  itemController.getItemByToken
);

// Get available time slots
router.get(
  "/time-slots",
  userAuth,
  itemController.getTimeSlots
);

// Get user's tokens
router.get(
  "/my-tokens",
  userAuth,
  itemController.getUserTokens
);

// Get items by status
router.get(
  "/status/:status",
  userAuth,
  itemController.getItemsByStatus
);

module.exports = router;