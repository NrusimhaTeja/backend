const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: 'Validation Error', errors });
    }
  
    // JWT authentication error
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
  
    // Default to 500 server error
    res.status(500).json({
      message: err.message || 'Internal Server Error',
    });
  };
  
  module.exports = errorHandler;
  