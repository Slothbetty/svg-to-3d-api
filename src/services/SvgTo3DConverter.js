import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { Group, ExtrudeGeometry, Mesh, MeshLambertMaterial, Color, Shape, Vector3, Box3 } from 'three';
import potrace from 'potrace';

export class SvgTo3DConverter {
  constructor() {
    this.svgLoader = new SVGLoader();
    this.supportedFormats = {
      stl: {
        extension: 'stl',
        mimeType: 'application/octet-stream',
        label: 'STL'
      },
      gltf: {
        extension: 'gltf',
        mimeType: 'application/octet-stream',
        label: 'GLTF'
      }
    };
    
    // Cache exporter instances (similar to ModelExporter pattern)
    this.exporters = {
      stl: null,
      gltf: null
    };
  }

  /**
   * Convert SVG data to 3D model
   * @param {string} svgData - SVG content as string
   * @param {Object} options - Conversion options
   * @returns {Promise<Buffer>} - 3D model data
   */
  async convertSvgTo3D(svgData, options = {}) {
    const {
      format = 'stl',
      depth = 2,
      size = 37,
      curveSegments = 32, // Reduced from 64 to 32 for smaller files (matching bekuto3d optimization)
      defaultColor = '#FFA500',
      drawFillShapes = true,
      drawStrokes = false
    } = options;

    let shapes = null;
    let modelGroup = null;

    try {
      // Parse SVG and create shapes
      shapes = this.createShapesFromSvg(svgData, {
        defaultColor,
        defaultDepth: depth,
        drawFillShapes,
        drawStrokes
      });

      if (shapes.length === 0) {
        throw new Error('No valid shapes found in SVG');
      }

      // Create 3D model group
      modelGroup = this.create3DModel(shapes, {
        depth,
        size,
        curveSegments
      });

      // Export to requested format
      const result = await this.exportModel(modelGroup, format);
      
      return result;

    } catch (error) {
      throw new Error(`Failed to convert SVG to 3D: ${error.message}`);
    } finally {
      // Clean up memory to prevent leaks
      this.cleanupMemory(shapes, modelGroup);
    }
  }

  /**
   * Convert bitmap image to SVG using potrace
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<string>} - SVG data
   */
  async convertBitmapToSvg(imageBuffer) {
    return new Promise((resolve, reject) => {
      try {
        // Use potrace to convert bitmap to SVG
        potrace.trace(imageBuffer, (err, svg) => {
          if (err) {
            reject(new Error(`Failed to convert bitmap to SVG: ${err.message}`));
            return;
          }

          // Add padding and background
          const padding = 8;
          const cornerRadius = 8;
          
          // Extract content from SVG
          const contentMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
          const content = contentMatch ? contentMatch[1] : '';

          // Create enhanced SVG with background
          const enhancedSvg = `<svg width="200" height="200" viewBox="0 0 200 200">
  <rect x="0" y="0" width="200" height="200" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
  <g transform="translate(${padding},${padding})">
    ${content}
  </g>
</svg>`;

          resolve(enhancedSvg);
        });
      } catch (error) {
        reject(new Error(`Bitmap conversion error: ${error.message}`));
      }
    });
  }

  /**
   * Create shapes from SVG data
   * @param {string} svgData - SVG content
   * @param {Object} options - Shape creation options
   * @returns {Array} - Array of shape objects
   */
  createShapesFromSvg(svgData, options = {}) {
    const {
      defaultColor = '#FFA500',
      defaultDepth = 2,
      defaultStartZ = 0,
      drawFillShapes = true,
      drawStrokes = false
    } = options;

    try {
      const svgParsed = this.svgLoader.parse(svgData);
      const shapes = [];

      console.log('SVG parsed paths count:', svgParsed.paths.length);

      if (svgParsed.paths.length === 0) {
        console.warn('No paths found in SVG, creating fallback shape');
        // Create a fallback shape if no paths are found
        const fallbackShape = new Shape();
        fallbackShape.moveTo(-10, -10);
        fallbackShape.lineTo(10, -10);
        fallbackShape.lineTo(10, 10);
        fallbackShape.lineTo(-10, 10);
        fallbackShape.lineTo(-10, -10);
        
        shapes.push({
          shape: fallbackShape,
          color: new Color().setStyle(defaultColor),
          startZ: defaultStartZ,
          depth: defaultDepth,
          opacity: 1,
          polygonOffset: 0
        });
      } else {
        svgParsed.paths.forEach((path, index) => {
          console.log(`Processing path ${index}:`, path.userData?.style);
          
          // Process filled shapes
          if (drawFillShapes) {
            const fillColor = path.userData?.style?.fill || defaultColor;
            const fillOpacity = path.userData?.style?.fillOpacity ?? 1;

            if (fillColor !== undefined && fillColor !== 'none') {
              try {
                const pathShapes = SVGLoader.createShapes(path);
                console.log(`Created ${pathShapes.length} shapes from path ${index}`);
                
                pathShapes.forEach((shape) => {
                  shapes.push({
                    shape,
                    color: new Color().setStyle(fillColor),
                    startZ: defaultStartZ,
                    depth: defaultDepth,
                    opacity: fillOpacity,
                    polygonOffset: 0
                  });
                });
              } catch (error) {
                console.error(`Error creating shapes from path ${index}:`, error);
              }
            }
          }
        });
      }

      console.log(`Total shapes created: ${shapes.length}`);
      return shapes;
    } catch (error) {
      console.error('Error parsing SVG:', error);
      throw new Error(`Failed to parse SVG: ${error.message}`);
    }
  }

  /**
   * Create 3D model from shapes
   * @param {Array} shapes - Array of shape objects
   * @param {Object} options - 3D model options
   * @returns {Group} - Three.js Group containing the 3D model
   */
  create3DModel(shapes, options = {}) {
    const { depth = 2, size = 37, curveSegments = 32 } = options;
    const group = new Group();

    shapes.forEach((shapeData) => {
      if (shapeData.depth > 0) {
        // Create extrude geometry with optimized settings for smaller files
        const extrudeSettings = {
          depth: shapeData.depth,
          bevelEnabled: false,
          curveSegments,
          steps: 1 // Add steps to reduce vertical subdivisions
        };

        const geometry = new ExtrudeGeometry(shapeData.shape, extrudeSettings);
        
        // Create material
        const material = new MeshLambertMaterial({
          color: shapeData.color,
          transparent: true,
          opacity: shapeData.opacity
        });

        // Create mesh
        const mesh = new Mesh(geometry, material);
        mesh.position.z = shapeData.startZ;
        mesh.userData = { originalShape: shapeData };

        group.add(mesh);
      }
    });

    // Scale and center the model
    this.scaleAndCenterModel(group, size);

    // Log final dimensions for verification
    const finalBox = new Box3().setFromObject(group);
    const finalSize = new Vector3();
    finalBox.getSize(finalSize);
    console.log('Final model dimensions:');
    console.log('  X:', finalSize.x.toFixed(2), 'mm');
    console.log('  Y:', finalSize.y.toFixed(2), 'mm');
    console.log('  Z:', finalSize.z.toFixed(2), 'mm');

    return group;
  }

  /**
   * Scale and center the 3D model (only X and Y dimensions, preserve Z-depth)
   * @param {Group} modelGroup - The 3D model group
   * @param {number} targetSize - Target size in mm for X and Y dimensions
   */
  scaleAndCenterModel(modelGroup, targetSize) {
    if (modelGroup.children.length === 0) return;

    // Calculate bounding box
    const box = new Box3().setFromObject(modelGroup);
    const size = new Vector3();
    box.getSize(size);

    // Calculate scale factor based only on X and Y dimensions (preserve Z-depth)
    const maxDimension = Math.max(size.x, size.y);
    const scaleFactor = targetSize / maxDimension;

    // Apply scaling only to X and Y dimensions
    modelGroup.scale.set(scaleFactor, scaleFactor, 1);

    // Center the model
    const center = new Vector3();
    box.getCenter(center);
    // Only center X and Y, preserve Z positioning
    modelGroup.position.set(
      -center.x * scaleFactor,
      -center.y * scaleFactor,
      modelGroup.position.z
    );
  }

  /**
   * Export 3D model to specified format using exportHandlers pattern
   * @param {Group} modelGroup - The 3D model group
   * @param {string} format - Export format (stl, gltf)
   * @returns {Promise<Buffer>} - Exported model data
   */
  async exportModel(modelGroup, format) {
    const formatConfig = this.supportedFormats[format];
    
    if (!formatConfig) {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Use exportHandlers pattern similar to ModelExporter
    const exportHandlers = {
      async stl() {
        if (!modelGroup) return null;
        this.exporters.stl ||= new STLExporter();
        
        // Use binary export for smaller file size (matching bekuto3d approach)
        const binaryResult = this.exporters.stl.parse(modelGroup, { binary: true });
        
        if (!binaryResult) {
          throw new Error('STL export failed - no result returned');
        }
        
        // Optional: Compare with text format for size analysis
        const textResult = this.exporters.stl.parse(modelGroup, { binary: false });
        const binarySize = binaryResult ? (binaryResult.byteLength || binaryResult.length) : 0;
        const sizeReduction = textResult && binarySize ? 
          ((textResult.length - binarySize) / textResult.length * 100).toFixed(1) : 0;
        
        console.log('STL export successful:');
        console.log('  Binary size:', binarySize, 'bytes');
        if (textResult) {
          console.log('  Text size:', textResult.length, 'bytes');
          console.log('  Size reduction:', sizeReduction + '%');
        }
        
        // Handle different result types from STLExporter
        if (binaryResult instanceof ArrayBuffer) {
          return Buffer.from(binaryResult);
        } else if (binaryResult instanceof DataView) {
          // Handle DataView (common with binary STL export)
          return Buffer.from(binaryResult.buffer, binaryResult.byteOffset, binaryResult.byteLength);
        } else if (typeof binaryResult === 'string') {
          return Buffer.from(binaryResult, 'utf8');
        } else if (binaryResult && typeof binaryResult === 'object' && binaryResult.length !== undefined) {
          // Handle Uint8Array or similar typed array
          return Buffer.from(binaryResult);
        } else {
          throw new Error('Unexpected STL export result type: ' + typeof binaryResult + ', constructor: ' + binaryResult.constructor.name);
        }
      },

      async gltf() {
        if (!modelGroup) return null;
        return new Promise((resolve, reject) => {
          this.exporters.gltf ||= new GLTFExporter();
          
          this.exporters.gltf.parse(modelGroup, (result) => {
            try {
              let buffer;
              if (result instanceof ArrayBuffer) {
                buffer = Buffer.from(result);
              } else {
                buffer = Buffer.from(JSON.stringify(result));
              }
              resolve(buffer);
            } catch (error) {
              reject(new Error(`GLTF export failed: ${error.message}`));
            }
          }, (error) => {
            reject(new Error(`GLTF export failed: ${error.message}`));
          }, { binary: true });
        });
      }
    };

    const handler = exportHandlers[format];
    if (!handler) {
      throw new Error(`Export format ${format} not implemented`);
    }

    return await handler.call(this);
  }

  /**
   * Get supported export formats
   * @returns {Object} - Supported formats configuration
   */
  getSupportedFormats() {
    return Object.keys(this.supportedFormats).map(key => ({
      format: key,
      ...this.supportedFormats[key]
    }));
  }

  /**
   * Get format configuration
   * @param {string} format - Format name
   * @returns {Object} - Format configuration
   */
  getFormatConfig(format) {
    return this.supportedFormats[format];
  }

  /**
   * Validate SVG data
   * @param {string} svgData - SVG content
   * @returns {boolean} - Whether SVG is valid
   */
  isValidSvg(svgData) {
    if (!svgData || svgData.trim() === '') {
      return false;
    }

    const lowerCode = svgData.toLowerCase();
    const svgStart = lowerCode.indexOf('<svg');
    const svgEnd = lowerCode.indexOf('</svg>');

    return svgStart !== -1
      && svgEnd !== -1
      && svgStart < svgEnd
      && (lowerCode.includes('viewbox') || lowerCode.includes('width') || lowerCode.includes('height'));
  }

  /**
   * Clean up memory by disposing Three.js objects
   * @param {Array} shapes - Array of shape objects
   * @param {Group} modelGroup - Three.js Group object
   */
  cleanupMemory(shapes, modelGroup) {
    try {
      // Dispose of shapes if they exist
      if (shapes && Array.isArray(shapes)) {
        shapes.forEach(shapeData => {
          if (shapeData.shape && shapeData.shape.dispose) {
            shapeData.shape.dispose();
          }
        });
      }

      // Dispose of 3D model group and its children
      if (modelGroup) {
        modelGroup.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        modelGroup.clear();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.warn('Error during memory cleanup:', error.message);
    }
  }
}
