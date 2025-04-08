const crypto = require("crypto");

exports.generateItemToken = () => {
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ITEM-${randomBytes}`;
};