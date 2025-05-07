const express = require("express");
const router = express.Router();
const userAuth = require("../utils/userAuth");
const checkRole = require("../utils/roleAuth");
const adminController = require("../controllers/adminController");

// Get all users - Admin only
router.get(
  "/users",
  userAuth,
  checkRole(["admin"]),
  adminController.getAllUsers
);

// Search users by email - Admin only
router.get(
  "/users/search",
  userAuth,
  checkRole(["admin"]),
  adminController.searchUsersByEmail
);

// Update user role - Admin only
router.put(
  "/users/:id/role",
  userAuth,
  checkRole(["admin"]),
  adminController.updateUserRole
);

// Delete user - Admin only
router.delete(
  "/users/:id",
  userAuth,
  checkRole(["admin"]),
  adminController.deleteUser
);

module.exports = router;
