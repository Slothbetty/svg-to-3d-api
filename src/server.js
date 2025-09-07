// Setup DOM polyfill first
import './setup-dom.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { SvgTo3DConverter } from './services/SvgTo3DConverter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateSvg } from './middleware/validateSvg.js';
import { FileManager } from './services/FileManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Configure multer for file uploads with stricter limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (reduced from 10MB)
    files: 1, // Only allow one file at a time
    fieldSize: 1024 * 1024, // 1MB limit for form fields
  },
  fileFilter: (req, file, cb) => {
    // Accept SVG files and common image formats
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only SVG and image files are allowed.'), false);
    }
  }
});

// Initialize services
const converter = new SvgTo3DConverter();
const fileManager = new FileManager();

// Memory monitoring and limits
const MAX_MEMORY_USAGE = 0.95; // 95% of available memory (more reasonable threshold)
const WARNING_MEMORY_USAGE = 0.85; // 85% warning threshold
const MEMORY_CHECK_INTERVAL = 30000; // Check every 30 seconds

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    heapUsagePercent: (usage.heapUsed / usage.heapTotal) * 100
  };
}

function checkMemoryUsage() {
  const memory = getMemoryUsage();
  console.log('Memory usage:', memory);
  
  if (memory.heapUsagePercent > WARNING_MEMORY_USAGE * 100) {
    console.warn(`High memory usage detected: ${memory.heapUsagePercent.toFixed(1)}%`);
    
    // Force garbage collection if available
    if (global.gc) {
      console.log('Running garbage collection...');
      global.gc();
    }
    
    // Clear expired files to free up memory
    fileManager.cleanupExpiredFiles();
  }
}

// Start memory monitoring
setInterval(checkMemoryUsage, MEMORY_CHECK_INTERVAL);

// Health check endpoint
app.get('/health', (req, res) => {
  const memory = getMemoryUsage();
  let status = 'healthy';
  
  if (memory.heapUsagePercent > MAX_MEMORY_USAGE * 100) {
    status = 'critical';
  } else if (memory.heapUsagePercent > WARNING_MEMORY_USAGE * 100) {
    status = 'warning';
  }
  
  res.json({ 
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    memory: memory
  });
});

// Convert SVG to 3D model endpoint - returns download URLs
app.post('/convert', upload.single('file'), validateSvg, async (req, res, next) => {
  try {
    // Check memory usage before processing
    const memory = getMemoryUsage();
    
    // Only block requests if memory is critically high (95%+)
    if (memory.heapUsagePercent > MAX_MEMORY_USAGE * 100) {
      // Try to free up memory first
      if (global.gc) {
        global.gc();
      }
      fileManager.cleanupExpiredFiles();
      
      // Check again after cleanup
      const memoryAfterCleanup = getMemoryUsage();
      if (memoryAfterCleanup.heapUsagePercent > MAX_MEMORY_USAGE * 100) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Server memory usage is critically high. Please try again later.',
          memory: memoryAfterCleanup
        });
      }
    }

    const { 
      format = 'stl', 
      depth = 2, 
      size = 37, 
      curveSegments = 64, // Balanced for smoothness without memory issues
      defaultColor = '#FFA500',
      drawFillShapes = true,
      drawStrokes = false,
      fileName = 'model'
    } = req.body;

    let svgData;
    
    if (req.file) {
      // Handle file upload
      const fileBuffer = req.file.buffer;
      const mimeType = req.file.mimetype;
      
      if (mimeType === 'image/svg+xml') {
        svgData = fileBuffer.toString('utf-8');
      } else {
        // Convert bitmap to SVG using potrace
        svgData = await converter.convertBitmapToSvg(fileBuffer);
      }
    } else if (req.body.svgData) {
      // Handle direct SVG data
      svgData = req.body.svgData;
    } else {
      return res.status(400).json({
        error: 'No SVG data provided. Please provide either a file upload or svgData in the request body.'
      });
    }

    // Validate SVG data size
    if (svgData && svgData.length > 5 * 1024 * 1024) { // 5MB limit
      return res.status(413).json({
        error: 'SVG data too large',
        message: 'SVG data exceeds the 5MB size limit. Please use a smaller file.'
      });
    }

    // Convert SVG to 3D model
    console.log('Starting SVG to 3D conversion...');
    const result = await converter.convertSvgTo3D(svgData, {
      format,
      depth: parseFloat(depth),
      size: parseFloat(size),
      curveSegments: parseInt(curveSegments),
      defaultColor,
      drawFillShapes: drawFillShapes === 'true' || drawFillShapes === true,
      drawStrokes: drawStrokes === 'true' || drawStrokes === true
    });

    console.log('Conversion completed, result length:', result.length);

    // Save file and generate download URL
    const fileId = fileManager.saveFile(result, format, fileName);
    const downloadUrl = `${req.protocol}://${req.get('host')}/download/${fileId}`;
    
    const formatConfig = converter.getFormatConfig(format);

    // Clean up memory after successful conversion
    if (global.gc) {
      global.gc();
    }

    res.json({
      success: true,
      fileId,
      downloadUrl,
      format: formatConfig.label,
      extension: formatConfig.extension,
      mimeType: formatConfig.mimeType,
      fileName: `${fileName}.${formatConfig.extension}`,
      fileSize: result.length,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  } catch (error) {
    next(error);
  }
});

// Download endpoint for generated files
app.get('/download/:fileId', (req, res, next) => {
  try {
    const { fileId } = req.params;
    const fileData = fileManager.getFile(fileId);
    
    if (!fileData) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file has expired or does not exist.'
      });
    }

    const { buffer, format, fileName, mimeType } = fileData;
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache'
    });

    res.send(buffer);

  } catch (error) {
    next(error);
  }
});

// Get supported formats endpoint
app.get('/formats', (req, res) => {
  const formats = converter.getSupportedFormats();
  res.json({ formats });
});

// Get conversion options endpoint
app.get('/options', (req, res) => {
  const options = {
    formats: converter.getSupportedFormats(),
    parameters: {
      depth: {
        type: 'number',
        default: 2,
        min: 0.1,
        max: 10,
        description: 'Extrusion depth in mm'
      },
      size: {
        type: 'number',
        default: 37,
        min: 1,
        max: 1000,
        description: 'Model size in mm'
      },
      curveSegments: {
        type: 'number',
        default: 64,
        min: 4,
        max: 256,
        description: 'Curve subdivision level'
      },
      defaultColor: {
        type: 'string',
        default: '#FFA500',
        description: 'Default color for shapes without fill'
      },
      drawFillShapes: {
        type: 'boolean',
        default: true,
        description: 'Whether to process filled shapes'
      },
      drawStrokes: {
        type: 'boolean',
        default: false,
        description: 'Whether to process stroke outlines'
      }
    }
  };
  
  res.json(options);
});

// Get file manager statistics endpoint
app.get('/stats', (req, res) => {
  const stats = fileManager.getStats();
  res.json({
    fileManager: stats,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist.`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SVG to 3D API server running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 File cleanup interval: 1 hour`);
});

export default app;
