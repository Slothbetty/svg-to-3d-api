// Test SVG parsing directly
import './src/setup-dom.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const svgData = '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

console.log('Testing SVG parsing...');
console.log('SVG data:', svgData);

try {
  const loader = new SVGLoader();
  const svgParsed = loader.parse(svgData);
  
  console.log('SVG parsed successfully');
  console.log('Paths count:', svgParsed.paths.length);
  console.log('Paths:', svgParsed.paths);
  
  if (svgParsed.paths.length > 0) {
    svgParsed.paths.forEach((path, index) => {
      console.log(`Path ${index}:`, path);
      console.log(`Path userData:`, path.userData);
      console.log(`Path style:`, path.userData?.style);
    });
  }
} catch (error) {
  console.error('Error parsing SVG:', error);
}
