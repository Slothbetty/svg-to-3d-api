/**
 * Test client for SVG to 3D API
 * This script demonstrates how to use the API with various examples
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000';

// Test SVG data
const testSvgData = `<svg width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="red" stroke="black" stroke-width="2"/>
  <rect x="20" y="20" width="60" height="60" fill="blue" opacity="0.5"/>
</svg>`;

// Create test SVG file
const testSvgPath = path.join(process.cwd(), 'test-input.svg');
fs.writeFileSync(testSvgPath, testSvgData);

/**
 * Test API health
 */
async function testHealth() {
  console.log('🔍 Testing API health...');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

/**
 * Test getting supported formats
 */
async function testGetFormats() {
  console.log('\n🔍 Testing supported formats...');
  try {
    const response = await fetch(`${API_BASE_URL}/formats`);
    const data = await response.json();
    console.log('✅ Supported formats:', data);
    return data.formats;
  } catch (error) {
    console.error('❌ Get formats failed:', error.message);
    return [];
  }
}

/**
 * Test getting conversion options
 */
async function testGetOptions() {
  console.log('\n🔍 Testing conversion options...');
  try {
    const response = await fetch(`${API_BASE_URL}/options`);
    const data = await response.json();
    console.log('✅ Conversion options:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Get options failed:', error.message);
    return null;
  }
}

/**
 * Test SVG to STL conversion with file upload
 */
async function testSvgToStlWithFile() {
  console.log('\n🔍 Testing SVG to STL conversion with file upload...');
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(testSvgPath));
    form.append('format', 'stl');
    form.append('depth', '2');
    form.append('size', '50');
    form.append('fileName', 'test-model');

    const response = await fetch(`${API_BASE_URL}/convert`, {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Conversion successful:', result);
      
      // Download the file using the provided URL
      const downloadResponse = await fetch(result.downloadUrl);
      if (downloadResponse.ok) {
        const buffer = await downloadResponse.arrayBuffer();
        const outputPath = path.join(process.cwd(), result.fileName);
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        console.log('✅ STL file downloaded:', outputPath);
        console.log('📊 File size:', buffer.byteLength, 'bytes');
        return true;
      } else {
        console.error('❌ File download failed');
        return false;
      }
    } else {
      const error = await response.json();
      console.error('❌ STL conversion failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ STL conversion error:', error.message);
    return false;
  }
}

/**
 * Test SVG to GLTF conversion with inline data
 */
async function testSvgToGltfWithData() {
  console.log('\n🔍 Testing SVG to GLTF conversion with inline data...');
  try {
    const response = await fetch(`${API_BASE_URL}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        svgData: testSvgData,
        format: 'gltf',
        depth: 3,
        size: 60,
        curveSegments: 32,
        fileName: 'test-gltf-model'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Conversion successful:', result);
      
      // Download the file using the provided URL
      const downloadResponse = await fetch(result.downloadUrl);
      if (downloadResponse.ok) {
        const buffer = await downloadResponse.arrayBuffer();
        const outputPath = path.join(process.cwd(), result.fileName);
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        console.log('✅ GLTF file downloaded:', outputPath);
        console.log('📊 File size:', buffer.byteLength, 'bytes');
        return true;
      } else {
        console.error('❌ File download failed');
        return false;
      }
    } else {
      const error = await response.json();
      console.error('❌ GLTF conversion failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ GLTF conversion error:', error.message);
    return false;
  }
}

/**
 * Test error handling with invalid data
 */
async function testErrorHandling() {
  console.log('\n🔍 Testing error handling...');
  
  // Test with invalid SVG
  try {
    const response = await fetch(`${API_BASE_URL}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        svgData: 'invalid svg data',
        format: 'stl'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('✅ Error handling works:', error.error);
      return true;
    } else {
      console.log('❌ Expected error but got success');
      return false;
    }
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

/**
 * Test with unsupported format
 */
async function testUnsupportedFormat() {
  console.log('\n🔍 Testing unsupported format...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        svgData: testSvgData,
        format: 'unsupported'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('✅ Unsupported format error:', error.error);
      return true;
    } else {
      console.log('❌ Expected error but got success');
      return false;
    }
  } catch (error) {
    console.error('❌ Unsupported format test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting SVG to 3D API Tests\n');
  
  const results = {
    health: await testHealth(),
    formats: await testGetFormats(),
    options: await testGetOptions(),
    svgToStl: await testSvgToStlWithFile(),
    svgToGltf: await testSvgToGltfWithData(),
    errorHandling: await testErrorHandling(),
    unsupportedFormat: await testUnsupportedFormat()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the API server.');
  }

  // Cleanup
  try {
    fs.unlinkSync(testSvgPath);
    console.log('\n🧹 Cleaned up test files');
  } catch (error) {
    console.log('\n⚠️  Could not clean up test files:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export {
  testHealth,
  testGetFormats,
  testGetOptions,
  testSvgToStlWithFile,
  testSvgToGltfWithData,
  testErrorHandling,
  testUnsupportedFormat,
  runAllTests
};
