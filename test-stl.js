// Test STL export directly
import './src/setup-dom.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { Group, ExtrudeGeometry, Mesh, MeshLambertMaterial, Color, Vector3, Box3 } from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

const svgData = '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

console.log('Testing STL export...');

try {
  // Parse SVG and create 3D model
  const loader = new SVGLoader();
  const svgParsed = loader.parse(svgData);
  const path = svgParsed.paths[0];
  const pathShapes = SVGLoader.createShapes(path);
  const shape = pathShapes[0];
  
  const group = new Group();
  const extrudeSettings = { depth: 2, bevelEnabled: false, curveSegments: 32 }; // Updated for smaller files
  const geometry = new ExtrudeGeometry(shape, extrudeSettings);
  const material = new MeshLambertMaterial({ color: 0xff0000 });
  const mesh = new Mesh(geometry, material);
  group.add(mesh);
  
  console.log('3D model created');
  
  // Test STL export
  const exporter = new STLExporter();
  
  console.log('Testing binary STL export...');
  const binaryResult = exporter.parse(group, { binary: true });
  console.log('Binary result type:', typeof binaryResult);
  console.log('Binary result is ArrayBuffer:', binaryResult instanceof ArrayBuffer);
  console.log('Binary result length:', binaryResult ? binaryResult.byteLength : 'undefined');
  
  console.log('Testing text STL export...');
  const textResult = exporter.parse(group, { binary: false });
  console.log('Text result type:', typeof textResult);
  console.log('Text result length:', textResult ? textResult.length : 'undefined');
  
  if (textResult) {
    console.log('Text result preview:', textResult.substring(0, 200));
  }
  
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}
