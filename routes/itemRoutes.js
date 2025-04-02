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
  roleAuth(["securityGuard", "securityOfficer"]),
  itemController.reviewItem
);

//verify by (security Officer)
router.post(
  "/:id/verify",
  userAuth,
  roleAuth(["securityOfficer"]),
  itemController.verifyItem
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

// Get user's item tokens
router.get("/my-item-tokens", userAuth, itemController.getUserItemTokens);

// Get user's request tokens
router.get("/my-request-tokens", userAuth, itemController.getUserRequestTokens);

// Get received requests by security Officer
router.get("/received-requests", userAuth, roleAuth(["securityOfficer"]), itemController.getreceivedRequests);

// Get items by status
router.get("/status/:status", userAuth, itemController.getItemsByStatus);

//verify claim request
router.post('/verify/:id', userAuth, roleAuth(["securityOfficer"]), itemController.verifyClaimRequest);


module.exports = router;
