// utils/generateToken.js
const crypto = require("crypto");

exports.generateItemToken = () => {
  // Generate a random string and take first 8 characters
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  // Add a prefix to make it recognizable
  return `ITEM-${randomBytes}`;
};