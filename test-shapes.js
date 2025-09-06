// Test shape creation
import './src/setup-dom.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { Shape } from 'three';

const svgData = '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

console.log('Testing shape creation...');

try {
  const loader = new SVGLoader();
  const svgParsed = loader.parse(svgData);
  
  console.log('SVG parsed, paths count:', svgParsed.paths.length);
  
  svgParsed.paths.forEach((path, index) => {
    console.log(`\nProcessing path ${index}:`);
    console.log('Fill color:', path.userData?.style?.fill);
    
    if (path.userData?.style?.fill && path.userData?.style?.fill !== 'none') {
      try {
        const pathShapes = SVGLoader.createShapes(path);
        console.log(`Created ${pathShapes.length} shapes from path ${index}`);
        
        pathShapes.forEach((shape, shapeIndex) => {
          console.log(`Shape ${shapeIndex}:`, shape);
          console.log(`Shape curves count:`, shape.curves.length);
          console.log(`Shape holes count:`, shape.holes.length);
        });
      } catch (error) {
        console.error(`Error creating shapes from path ${index}:`, error);
      }
    }
  });
} catch (error) {
  console.error('Error:', error);
}
