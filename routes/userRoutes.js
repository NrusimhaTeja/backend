const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const userAuth = require("../utils/userAuth");

// Get user profile
router.get("/profile", userAuth, userController.getUserProfile);

// Update user profile
router.put("/profile", userAuth, userController.updateUserProfile);

module.exports = router;
