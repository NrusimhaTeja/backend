const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Register user
router.post("/register", upload.single("profilePhoto"), authController.register);

// Login user
router.post("/login", authController.login);

// Logout user
router.post("/logout", authController.logout);

module.exports = router;