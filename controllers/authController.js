const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

exports.register = async (req, res) => {
  try {
    const userDetails = req.body;
    console.log("User details:", userDetails);

    // Hash the password
    const hashedPassword = await bcrypt.hash(userDetails.password, 10);

    // Prepare user data
    const userData = {
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      email: userDetails.email,
      password: hashedPassword,
      department: userDetails.department,
      designation: userDetails.designation,
      gender: userDetails.gender,
      id: userDetails.id,
      profilePhoto: null, // Will be updated if there's a photo
    };

    // If a profile photo was uploaded, upload it to Cloudinary
    if (req.file) {
      try {
        console.log("Uploading profile photo to Cloudinary...");
        const uploadResult = await uploadToCloudinary(req.file);

        // Add the image details to user data
        userData.profilePhoto = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        };

        console.log("Photo uploaded successfully:", userData.profilePhoto);
      } catch (uploadError) {
        console.error("Error uploading photo:", uploadError);
        return res.status(500).json({
          message: "Error uploading profile photo. Please try again.",
        });
      }
    }

    // Create and save the user
    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Error in signup:", err);

    // Handle specific error cases
    if (err.code === 11000) {
      // Duplicate key error (email or id already exists)
      return res.status(400).json({
        message: "A user with this email or ID already exists.",
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const validationErrors = Object.values(err.errors).map(
        (error) => error.message
      );
      return res.status(400).json({
        message: validationErrors.join(", "),
      });
    }

    // Generic error response
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("hello");
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Invalid Credentials" });
    }
    const isValidUser = await bcrypt.compare(password, user.password);
    if (isValidUser) {
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
      res.cookie("token", token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        sameSite: "strict", 
      });
      
      res.send(user);
    } else {
      return res.json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    console.log("ERROR : " + err.message);
    res.json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res.cookie("token", null, { maxAge: 0 });
  res.json({ message: "user logged out successfully" });
};


