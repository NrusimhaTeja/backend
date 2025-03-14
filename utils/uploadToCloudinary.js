const {upload, cloudinary} = require("../config/cloudinary");

// Helper function to upload to Cloudinary
async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    // Create a dataURI from the buffer
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    
    cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto'
    }, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = uploadToCloudinary;