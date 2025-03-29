const Item = require("../models/Item");
const ItemRequest = require("../models/ItemRequest");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const generateToken = require("../utils/generateToken");
const timeSlots = require("../utils/timeSlots");

exports.reportLostItem = async (req, res) => {
  try {
    // Extract required fields
    const { itemType, description } = req.body;
    
    // Extract optional fields
    const { location, date, time } = req.body;
    const { _id } = req.user;
    
    // Check required fields
    if (!itemType || !description) {
      return res.status(400).json({ 
        message: "Item type and description are required fields" 
      });
    }

    // Process uploaded images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file);
          imageUrls.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
    }

    // Create timestamp from date and time if provided, otherwise use current time
    let timestamp;
    if (date && time) {
      timestamp = new Date(`${date}T${time}`);
      
      // Validate the timestamp
      if (isNaN(timestamp.getTime())) {
        timestamp = new Date(); // Use current date/time if invalid
      }
    } else {
      timestamp = new Date();
    }

    // Create the item object with default values
    const item = new Item({
      itemType,
      description,
      location: location || "Unknown location",
      status: "lost",
      time: timestamp,
      reportedBy: _id,
      images: imageUrls,
    });
    
    await item.save();

    res.status(201).json({
      message: "Item reported as lost successfully",
      item,
    });
  } catch (err) {
    console.error("Error reporting item:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.reportFoundItem = async (req, res) => {
  try {
    const { itemType, description, location, date, time } = req.body;
    const { _id, role } = req.user;

    // Process uploaded images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file);
          imageUrls.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
    }

    // Create timestamp from date and time
    let timestamp;
    if (date && time) {
      timestamp = new Date(`${date}T${time}`);
    } else {
      timestamp = new Date();
    }

    // Generate token for the item
    const itemToken = generateToken.generateItemToken();

    // Create the item object
    const item = new Item({
      itemType,
      description,
      location,
      time: timestamp,
      status: role === "user" ? "submitted" : "received",
      foundBy: _id,
      images: imageUrls,
      token: itemToken,
    });

    await item.save();

    res.status(201).json({
      message:
        "Item submitted successfully. Please present this token to the security guard when handing over the item.",
      item,
      token: itemToken,
    });
  } catch (err) {
    console.error("Error reporting item:", err.message);
    res.status(500).json({ message: err.message });
  }
};
// Review found item by security guard
exports.reviewItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, securityNotes, rejectionReason } = req.body;
    const { _id } = req.user;

    if (status !== "received" && status !== "rejected") {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.status !== "submitted") {
      return res.status(400).json({
        message: "Item cannot be reviewed at this stage",
      });
    }

    // Update the item status
    item.status = status;
    item.receivedBy = _id;

    item.tokenVerifiedAt = new Date();

    if (status === "received") {
      if (securityNotes) {
        item.securityNotes = securityNotes;
      }
    } else if (status === "rejected") {
      item.rejectionReason = rejectionReason || "No reason provided";
    }

    await item.save();

    res.status(200).json({
      message:
        status === "received"
          ? "Item verified and published to the website"
          : "Item rejected",
      item,
    });
  } catch (err) {
    console.error("Error reviewing item:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Claim an item
exports.claimItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalNotes, timeSlot } = req.body;
    const { _id } = req.user;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.status !== "received") {
      return res.status(400).json({
        message: "This item is not available for claiming",
      });
    }

    // Process uploaded proof images
    const proofImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file);
        proofImages.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    // Create the claim request
    const itemRequest = new ItemRequest({
      itemId: id,
      requestType: "claim",
      requestedBy: _id,
      requestedTo: item.receivedBy,
      status: "pending",
      proofImages,
      additionalNotes,
      preferredContactMethod: preferredContactMethod || "email",
      appointmentTimeSlot: timeSlot, // Add the selected time slot
      requestDate: new Date(),
    });

    await itemRequest.save();

    res.status(201).json({
      message:
        "Claim request submitted successfully. Please visit the lost and found center at your selected time slot.",
      itemRequest,
    });
  } catch (err) {
    console.error("Error claiming item:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Verify claim by security officer
exports.verifyClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, verificationNotes } = req.body;
    const { _id } = req.user;

    const itemRequest = await ItemRequest.findById(id);
    if (!itemRequest) {
      return res.status(404).json({ message: "Claim request not found" });
    }

    if (itemRequest.status !== "pending") {
      return res.status(400).json({
        message: "This claim has already been processed",
      });
    }

    // Update the request
    itemRequest.status =
      verificationStatus === "approved" ? "verified" : "verification_failed";
    itemRequest.verifiedBy = _id;
    itemRequest.verificationNotes = verificationNotes;
    itemRequest.verificationDate = new Date();
    await itemRequest.save();

    // If approved, update the item status too
    if (verificationStatus === "approved") {
      const item = await Item.findById(itemRequest.itemId);
      if (item) {
        item.status = "claimed";
        item.claimedBy = itemRequest.requestedBy;
        item.verifiedBy = _id;
        item.isVisible = false;
        await item.save();
      }
    }

    res.status(200).json({
      message:
        verificationStatus === "approved"
          ? "Claim verified and item has been released to the claimer"
          : "Claim verification failed",
      itemRequest,
    });
  } catch (err) {
    console.error("Error verifying claim:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get items by token
exports.getItemByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const item = await Item.findOne({ token, status: "submitted" })
    if (!item) {
      return res.status(404).json({ message: "No item found with this token" });
    }

    res.status(200).json({
      message: "Item found",
      item,
    });
  } catch (err) {
    console.error("Error looking up item by token:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get available time slots
exports.getTimeSlots = async (req, res) => {
  try {
    // Get date from query parameters
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // Get available time slots for the requested date
    const availableSlots = await timeSlots.getAvailableTimeSlots(date);

    res.json({
      date,
      availableSlots,
    });
  } catch (err) {
    console.error("Error fetching time slots:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get user's tokens
exports.getUserTokens = async (req, res) => {
  try {
    const { _id } = req.user;

    const items = await Item.find({
      foundBy: _id,
      status: "submitted",
    }).select("itemType description location images status token time");

    res.json(items);
  } catch (err) {
    console.error("Error fetching user's item tokens:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get items by status
exports.getItemsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const { _id, role } = req.user;

    const validStatuses = [
      "lost",
      "received",
      "submitted",
      "claimed",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status requested" });
    }

    // Role-based access control for different statuses
    if (role === "user" && !["lost", "received"].includes(status)) {
      return res.status(403).json({
        message: "Access denied. Users can only view lost and received items.",
      });
    }

    if (
      role === "securityGuard" &&
      !["lost", "received", "submitted"].includes(status)
    ) {
      return res.status(403).json({
        message:
          "Access denied. Security guards can only view lost, received, and submitted items.",
      });
    }

    // Initialize query with status filter
    const query = { status };

    const itemList = await Item.find(query);

    if (itemList.length === 0) {
      return res.json({ message: "No items found", items: [] });
    }

    res.json(itemList);
  } catch (err) {
    console.error("Error fetching items:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
