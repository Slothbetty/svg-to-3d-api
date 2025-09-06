/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.message;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File Upload Error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      details = 'File size too large. Maximum size is 10MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      details = 'Too many files. Only one file is allowed.';
    } else {
      details = err.message;
    }
  } else if (err.message.includes('Invalid file type')) {
    statusCode = 400;
    message = 'Invalid File Type';
    details = err.message;
  } else if (err.message.includes('No valid shapes found')) {
    statusCode = 400;
    message = 'Invalid SVG Content';
    details = err.message;
  } else if (err.message.includes('Failed to convert SVG to 3D')) {
    statusCode = 422;
    message = 'Conversion Failed';
    details = err.message;
  } else if (err.message.includes('Unsupported format')) {
    statusCode = 400;
    message = 'Unsupported Format';
    details = err.message;
  } else if (err.message.includes('No SVG data provided')) {
    statusCode = 400;
    message = 'Missing SVG Data';
    details = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    message: details || err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};
