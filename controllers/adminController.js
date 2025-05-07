const User = require("../models/User");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search users by email
exports.searchUsersByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email query parameter is required" 
      });
    }

    const users = await User.find({ 
      email: { $regex: email, $options: 'i' } 
    }).select("-password");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate the role
    const validRoles = ["user", "securityGuard", "securityOfficer", "admin"];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role. Valid roles are: ${validRoles.join(", ")}` 
      });
    }

    // Check if the user exists
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Update the user's role
    user.role = role;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "User role updated successfully",
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user exists
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: "User deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};