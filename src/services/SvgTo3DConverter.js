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
      curveSegments = 64,
      defaultColor = '#FFA500',
      drawFillShapes = true,
      drawStrokes = false
    } = options;

    try {
      // Parse SVG and create shapes
      const shapes = this.createShapesFromSvg(svgData, {
        defaultColor,
        defaultDepth: depth,
        drawFillShapes,
        drawStrokes
      });

      if (shapes.length === 0) {
        throw new Error('No valid shapes found in SVG');
      }

      // Create 3D model group
      const modelGroup = this.create3DModel(shapes, {
        depth,
        size,
        curveSegments
      });

      // Export to requested format
      const result = await this.exportModel(modelGroup, format);
      
      return result;

    } catch (error) {
      throw new Error(`Failed to convert SVG to 3D: ${error.message}`);
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
    const { depth = 2, size = 37, curveSegments = 64 } = options;
    const group = new Group();

    shapes.forEach((shapeData) => {
      if (shapeData.depth > 0) {
        // Create extrude geometry
        const extrudeSettings = {
          depth: shapeData.depth,
          bevelEnabled: false,
          curveSegments
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

    return group;
  }

  /**
   * Scale and center the 3D model
   * @param {Group} modelGroup - The 3D model group
   * @param {number} targetSize - Target size in mm
   */
  scaleAndCenterModel(modelGroup, targetSize) {
    if (modelGroup.children.length === 0) return;

    // Calculate bounding box
    const box = new Box3().setFromObject(modelGroup);
    const size = new Vector3();
    box.getSize(size);

    // Calculate scale factor
    const maxDimension = Math.max(size.x, size.y);
    const scaleFactor = targetSize / maxDimension;

    // Apply scaling
    modelGroup.scale.setScalar(scaleFactor);

    // Center the model
    const center = new Vector3();
    box.getCenter(center);
    modelGroup.position.sub(center.multiplyScalar(scaleFactor));
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
        
        // Use text export for Node.js compatibility
        const result = this.exporters.stl.parse(modelGroup, { binary: false });
        
        if (!result) {
          throw new Error('STL export failed - no result returned');
        }
        
        console.log('STL export successful, size:', result.length, 'bytes');
        return Buffer.from(result, 'utf8');
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
}
