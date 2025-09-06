// DOM polyfill setup for Node.js environment
import { JSDOM } from 'jsdom';

// Create a virtual DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up global variables for Three.js
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

// Mock canvas for Three.js (simplified without canvas dependency)
global.HTMLCanvasElement = class HTMLCanvasElement {};
global.HTMLImageElement = class HTMLImageElement {};

console.log('✅ DOM polyfill setup complete');
