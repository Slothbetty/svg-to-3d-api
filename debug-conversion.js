// Debug the full conversion process
import './src/setup-dom.js';
import { SvgTo3DConverter } from './src/services/SvgTo3DConverter.js';

const svgData = '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

console.log('=== DEBUGGING SVG TO 3D CONVERSION ===');
console.log('SVG Data:', svgData);

try {
  const converter = new SvgTo3DConverter();
  
  console.log('\n1. Starting conversion...');
  const result = await converter.convertSvgTo3D(svgData, {
    format: 'stl',
    depth: 2,
    size: 37,
    curveSegments: 64,
    defaultColor: '#FFA500',
    drawFillShapes: true,
    drawStrokes: false
  });
  
  console.log('\n2. Conversion completed!');
  console.log('Result type:', typeof result);
  console.log('Result length:', result.length);
  console.log('Result is Buffer:', Buffer.isBuffer(result));
  
  if (result.length > 0) {
    console.log('First 100 characters:', result.toString('utf8').substring(0, 100));
  } else {
    console.log('ERROR: Result is empty!');
  }
  
} catch (error) {
  console.error('Conversion failed:', error);
  console.error('Stack:', error.stack);
}
