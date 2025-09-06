import { SvgTo3DConverter } from '../services/SvgTo3DConverter.js';

const converter = new SvgTo3DConverter();

/**
 * Middleware to validate SVG data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateSvg = (req, res, next) => {
  try {
    let svgData = null;

    // Check if SVG data is provided in request body
    if (req.body.svgData) {
      svgData = req.body.svgData;
    }
    // Check if file is uploaded
    else if (req.file) {
      const mimeType = req.file.mimetype;
      
      // For SVG files, validate the content
      if (mimeType === 'image/svg+xml') {
        svgData = req.file.buffer.toString('utf-8');
      }
      // For other image formats, we'll convert them later
      else if (mimeType.startsWith('image/')) {
        // Image files will be converted to SVG, so we'll validate later
        return next();
      }
    }

    // If we have SVG data, validate it
    if (svgData) {
      if (!converter.isValidSvg(svgData)) {
        return res.status(400).json({
          error: 'Invalid SVG Data',
          message: 'The provided SVG data is not valid. Please ensure it contains proper SVG markup with viewBox, width, or height attributes.'
        });
      }
    }

    // Validate conversion parameters
    const { depth, size, curveSegments } = req.body;
    
    if (depth !== undefined) {
      const depthNum = parseFloat(depth);
      if (isNaN(depthNum) || depthNum < 0.1 || depthNum > 10) {
        return res.status(400).json({
          error: 'Invalid Depth Parameter',
          message: 'Depth must be a number between 0.1 and 10.'
        });
      }
    }

    if (size !== undefined) {
      const sizeNum = parseFloat(size);
      if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 1000) {
        return res.status(400).json({
          error: 'Invalid Size Parameter',
          message: 'Size must be a number between 1 and 1000.'
        });
      }
    }

    if (curveSegments !== undefined) {
      const segmentsNum = parseInt(curveSegments);
      if (isNaN(segmentsNum) || segmentsNum < 4 || segmentsNum > 256) {
        return res.status(400).json({
          error: 'Invalid Curve Segments Parameter',
          message: 'Curve segments must be an integer between 4 and 256.'
        });
      }
    }

    // Validate format
    const { format } = req.body;
    if (format && !converter.getFormatConfig(format)) {
      return res.status(400).json({
        error: 'Unsupported Format',
        message: `Format '${format}' is not supported. Supported formats: ${converter.getSupportedFormats().map(f => f.format).join(', ')}`
      });
    }

    next();

  } catch (error) {
    next(error);
  }
};
