const Item = require("../models/Item");
const ItemRequest = require("../models/ItemRequest");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

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
        message: "Item type and description are required fields",
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
      imagesPublic: true,
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

    // Create the item object without token first
    const item = new Item({
      itemType,
      description,
      location,
      time: timestamp,
      status: role === "user" ? "submitted" : "received",
      foundBy: _id,
      images: imageUrls,
    });

    // Save the item to get its _id
    await item.save();

    // Now generate token using the item's _id
    const itemToken = `ITEM-${item._id}`;

    // Update the item with the token
    item.token = itemToken;
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
          ? "Item received by security. Pending verification for listing."
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
    const { additionalNotes, answers } = req.body;
    const { _id } = req.user;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.status !== "verified") {
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

    // Create the claim request without token first
    const itemRequest = new ItemRequest({
      itemId: id,
      requestType: "claim",
      requestedBy: _id, // Fixed the typo here from *id to _id
      status: "pending",
      answers: answers || [],
      proofImages,
      additionalNotes,
      requestDate: new Date(),
    });

    // Save to get the _id
    await itemRequest.save();

    // Generate token for the claim request using the request's _id
    const requestToken = `REQUEST-${itemRequest._id}`;

    // Update with the token
    itemRequest.token = requestToken;
    await itemRequest.save();

    res.status(201).json({
      message:
        "Claim request submitted successfully. Please present this token to the security office when you visit to collect the item.",
      itemRequest,
      token: requestToken,
    });
  } catch (err) {
    console.error("Error claiming item:", err.message);
    res.status(500).json({ message: err.message });
  }
};

//verify by security officer
exports.verifyItem = async (req, res) => {
  try {
    const { id } = req.params;
    let verifiedDescription = req.body.verifiedDescription;
    let questions = req.body.questions;
    let imagesPublic = req.body.imagesPublic || false;

    // Handle case when questions is a JSON string (from FormData)
    if (typeof questions === "string") {
      try {
        questions = JSON.parse(questions);
      } catch (err) {
        console.error("Error parsing questions:", err);
        return res.status(400).json({ message: "Invalid questions format" });
      }
    }

    // Convert imagesPublic to boolean if it's a string
    if (typeof imagesPublic === "string") {
      imagesPublic = imagesPublic.toLowerCase() === "true";
    }

    const { _id } = req.user;

    console.log("Verified Description:", verifiedDescription);
    console.log("Questions:", questions);
    console.log("Images Public:", imagesPublic);

    // Find the item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if item is already verified
    if (item.status === "verified") {
      return res.status(400).json({
        message: "This item has already been verified",
      });
    }

    // Update the item status to verified
    item.status = "verified";
    item.verifiedBy = _id;
    item.verificationDate = new Date();
    item.verifiedDescription = verifiedDescription;
    item.imagesPublic = imagesPublic;

    // Add questions for claiming
    item.questions = questions || [];

    await item.save();

    res.status(200).json({
      message: "Item has been verified and is now available for claiming",
      item,
    });
  } catch (err) {
    console.error("Error verifying item:", err.message);
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
    const userRole = req.user.role;

    // Determine if it's an item token or request token
    if (token.startsWith("ITEM-")) {
      // Extract item ID from token
      const itemId = token.replace("ITEM-", "");

      // Find item by its ID
      const item = await Item.findById(itemId);

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Check permissions based on role
      if (userRole === "securityGuard" && item.status === "submitted") {
        return res.status(200).json({ item });
      } else if (userRole === "securityOfficer" || userRole === "admin") {
        // Security officers and admins can access any item
        return res.status(200).json({ item });
      } else {
        return res.status(403).json({
          message: "You don't have permission to access this item",
        });
      }
    } else if (token.startsWith("REQUEST-")) {
      // Extract request ID from token
      const requestId = token.replace("REQUEST-", "");

      // Find request by its ID
      const request = await ItemRequest.findById(requestId).populate("itemId");

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check permissions based on role
      if (userRole === "securityOfficer" && request.status === "pending") {
        return res.status(200).json({ request });
      } else if (userRole === "admin") {
        // Admins can access any request
        return res.status(200).json({ request });
      } else {
        return res.status(403).json({
          message: "You don't have permission to access this request",
        });
      }
    } else {
      // Invalid token format
      return res.status(400).json({
        message: "Invalid token format",
      });
    }
  } catch (error) {
    console.error("Error retrieving by token:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get user's item tokens
exports.getUserItemTokens = async (req, res) => {
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

// Get user's request tokens
exports.getUserRequestTokens = async (req, res) => {
  try {
    const { _id, role } = req.user;
    
    const requests = await ItemRequest.find({
      requestedBy: _id,
      status: "pending",
    })
      .populate("itemId")
      .select("verifiedDescription images status token time");
    
    // Process each request to handle image visibility
    const processedRequests = requests.map(request => {
      // Convert to plain JavaScript object
      const plainRequest = request.toObject();
      
      // Check if the populated itemId has images that should be hidden
      if (plainRequest.itemId && !plainRequest.itemId.imagesPublic) {
        // Hide images from the item if not public
        plainRequest.itemId.images = [];
      }
      
      // Also check the request's own images if applicable
      if (plainRequest.images && !plainRequest.imagesPublic) {
        plainRequest.images = [];
      }
      
      return plainRequest;
    });
    
    console.log("Processed requests:", processedRequests);
    
    res.json(processedRequests);
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
      "verified",
      "claimed",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status requested" });
    }
    
    // Role-based access control for different statuses
    if (role === "user" && !["lost", "verified"].includes(status)) {
      return res.status(403).json({
        message: "Access denied. Users can only view lost and verified items.",
      });
    }
    
    if (
      role === "securityGuard" &&
      !["lost", "verified", "submitted"].includes(status)
    ) {
      return res.status(403).json({
        message:
          "Access denied. Security guards can only view lost, verified, and submitted items.",
      });
    }
    
    // Initialize query with status filter
    const query = { status };
    
    // First, get the items as Mongoose documents
    const items = await Item.find(query);
    
    if (items.length === 0) {
      return res.json({ message: "No items found", items: [] });
    }
    
    // Process the items based on role and convert to plain objects
    const itemList = items.map(item => {
      // Convert to plain JavaScript object
      const plainItem = item.toObject();
      
      // For user role, check if images should be hidden
      if (status === "verified" && !plainItem.imagesPublic) {
        plainItem.images = []; // Replace images with empty array when not public
      }
      
      return plainItem;
    });
    
    res.json(itemList);
  } catch (err) {
    console.error("Error fetching items:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getreceivedRequests = async (req, res) => {
  try {
    const { _id } = req.user;

    const requests = await ItemRequest.find({
      status: "pending",
    }).populate("itemId");
    console.log(requests);

    res.json(requests);
  } catch (err) {
    console.error("Error fetching user's item tokens:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Verify or reject an item claim request
exports.verifyClaimRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body; // 'approved' or 'rejected'

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    // Find the item request
    const itemRequest = await ItemRequest.findById(requestId);

    if (!itemRequest) {
      return res.status(404).json({ message: "Item request not found" });
    }

    // Find the associated item
    const item = await Item.findById(itemRequest.itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the item request status
    itemRequest.status = status;
    itemRequest.verificationDate = new Date();

    // Update the item status based on the verification decision
    if (status === "approved") {
      item.status = "claimed";
      item.claimedBy = itemRequest.requestedBy;
    }

    // Save both the request and item
    await Promise.all([itemRequest.save(), item.save()]);

    return res.status(200).json({
      message:
        status === "approved"
          ? "Claim approved successfully"
          : "Claim rejected successfully",
      itemRequest,
      item,
    });
  } catch (error) {
    console.error("Error processing claim verification:", error);
    return res
      .status(500)
      .json({ message: "Failed to process claim verification" });
  }
};
