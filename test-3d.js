// Test full 3D model creation
import './src/setup-dom.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { Group, ExtrudeGeometry, Mesh, MeshLambertMaterial, Color, Vector3, Box3 } from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

const svgData = '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

console.log('Testing full 3D model creation...');

try {
  // Parse SVG
  const loader = new SVGLoader();
  const svgParsed = loader.parse(svgData);
  console.log('SVG parsed, paths count:', svgParsed.paths.length);
  
  // Create shapes
  const shapes = [];
  svgParsed.paths.forEach((path, index) => {
    const fillColor = path.userData?.style?.fill || '#FFA500';
    if (fillColor !== 'none') {
      const pathShapes = SVGLoader.createShapes(path);
      pathShapes.forEach((shape) => {
        shapes.push({
          shape,
          color: new Color().setStyle(fillColor),
          startZ: 0,
          depth: 2,
          opacity: 1,
          polygonOffset: 0
        });
      });
    }
  });
  
  console.log('Created shapes:', shapes.length);
  
  // Create 3D model
  const group = new Group();
  shapes.forEach((shapeData, index) => {
    console.log(`Creating mesh for shape ${index}`);
    
    const extrudeSettings = {
      depth: shapeData.depth,
      bevelEnabled: false,
      curveSegments: 64
    };

    const geometry = new ExtrudeGeometry(shapeData.shape, extrudeSettings);
    console.log(`Geometry created for shape ${index}, vertices:`, geometry.attributes.position.count);
    
    const material = new MeshLambertMaterial({
      color: shapeData.color,
      transparent: true,
      opacity: shapeData.opacity
    });

    const mesh = new Mesh(geometry, material);
    mesh.position.z = shapeData.startZ;
    group.add(mesh);
  });
  
  console.log('3D model created, children count:', group.children.length);
  
  // Scale and center
  const box = new Box3().setFromObject(group);
  const size = new Vector3();
  box.getSize(size);
  console.log('Model bounding box size:', size);
  
  const maxDimension = Math.max(size.x, size.y);
  const scaleFactor = 37 / maxDimension;
  group.scale.setScalar(scaleFactor);
  console.log('Scale factor applied:', scaleFactor);
  
  // Export to STL
  const exporter = new STLExporter();
  const result = exporter.parse(group, { binary: true });
  console.log('STL export result length:', result.length);
  console.log('STL export successful!');
  
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}
