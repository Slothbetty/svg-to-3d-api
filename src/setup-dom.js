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

// Handle navigator property carefully (read-only in newer Node.js versions)
try {
  global.navigator = dom.window.navigator;
} catch (error) {
  // If navigator is read-only, create a custom one
  global.navigator = {
    userAgent: 'Node.js',
    platform: 'Node.js',
    language: 'en-US',
    languages: ['en-US'],
    onLine: true,
    cookieEnabled: false,
    ...dom.window.navigator
  };
}

global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

// Mock canvas for Three.js (simplified without canvas dependency)
global.HTMLCanvasElement = class HTMLCanvasElement {};
global.HTMLImageElement = class HTMLImageElement {};

console.log('✅ DOM polyfill setup complete');
