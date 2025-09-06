# SVG to 3D API

A production-ready RESTful API service that converts SVG files and bitmap images to 3D models using Three.js. This API is based on the SVG to 3D conversion logic from the Bekuto 3D project.

## ✨ Features

- 🎨 **SVG to 3D Conversion**: Convert SVG vector graphics to 3D models
- 🖼️ **Bitmap Support**: Convert bitmap images (PNG, JPG, etc.) to 3D models via SVG tracing
- 📦 **Multiple Export Formats**: Support for STL and GLTF formats
- ⚙️ **Customizable Parameters**: Control depth, size, colors, and curve quality
- 🔗 **URL-Based Downloads**: Generate secure download URLs for generated files
- 🛡️ **Robust Error Handling**: Comprehensive validation and error responses
- 🚀 **Production Ready**: Optimized for deployment with automatic file cleanup
- 📊 **File Management**: Automatic file expiration and cleanup (24 hours)

## 🚀 Quick Start

### Local Development

```bash
# Clone or download the project
cd svg-to-3d-api

# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

The API will be available at `http://localhost:3000`

### 🎯 Live Demo

**Try the API online:** [https://svg-to-3d-api.onrender.com](https://svg-to-3d-api.onrender.com)

**Test with Postman:** Import the collection from `postman/` folder

### Basic Usage

#### Convert SVG File

```bash
curl -X POST http://localhost:3000/convert \
  -F "file=@your-file.svg" \
  -F "format=stl" \
  -F "depth=2" \
  -F "size=37" \
  --output model.stl
```

#### Convert with SVG Data

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "svgData": "<svg width=\"100\" height=\"100\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"red\"/></svg>",
    "format": "gltf",
    "depth": 3,
    "size": 50
  }' \
  --output model.gltf
```

## API Endpoints

### POST /convert

Convert SVG or bitmap image to 3D model and return download URL.

**Request Body (multipart/form-data or application/json):**
- `file` (file, optional): SVG or image file
- `svgData` (string, optional): SVG content as string
- `format` (string, optional): Output format (`stl`, `gltf`) - default: `stl`
- `depth` (number, optional): Extrusion depth in mm (0.1-10) - default: `2`
- `size` (number, optional): Model size in mm (1-1000) - default: `37`
- `curveSegments` (number, optional): Curve subdivision level (4-256) - default: `64`
- `defaultColor` (string, optional): Default color for shapes - default: `#FFA500`
- `drawFillShapes` (boolean, optional): Process filled shapes - default: `true`
- `drawStrokes` (boolean, optional): Process stroke outlines - default: `false`
- `fileName` (string, optional): Custom file name - default: `model`

**Response:**
```json
{
  "success": true,
  "fileId": "uuid-string",
  "downloadUrl": "http://localhost:3000/download/uuid-string",
  "format": "STL",
  "extension": "stl",
  "mimeType": "application/octet-stream",
  "fileName": "model.stl",
  "fileSize": 12345,
  "expiresAt": "2024-01-02T00:00:00.000Z"
}
```

### GET /download/:fileId

Download generated 3D model file.

**Response:**
- Content-Type: Based on file format
- Body: Binary 3D model data

**Example Response Headers:**
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="model.stl"
Content-Length: 12345
Cache-Control: no-cache
```

### GET /formats

Get list of supported export formats.

**Response:**
```json
{
  "formats": [
    {
      "format": "stl",
      "extension": "stl",
      "mimeType": "application/octet-stream",
      "label": "STL"
    },
    {
      "format": "gltf",
      "extension": "gltf",
      "mimeType": "application/octet-stream",
      "label": "GLTF"
    }
  ]
}
```

### GET /options

Get available conversion parameters and their specifications.

**Response:**
```json
{
  "formats": [...],
  "parameters": {
    "depth": {
      "type": "number",
      "default": 2,
      "min": 0.1,
      "max": 10,
      "description": "Extrusion depth in mm"
    },
    "size": {
      "type": "number",
      "default": 37,
      "min": 1,
      "max": 1000,
      "description": "Model size in mm"
    },
    "curveSegments": {
      "type": "number",
      "default": 64,
      "min": 4,
      "max": 256,
      "description": "Curve subdivision level"
    },
    "defaultColor": {
      "type": "string",
      "default": "#FFA500",
      "description": "Default color for shapes without fill"
    },
    "drawFillShapes": {
      "type": "boolean",
      "default": true,
      "description": "Whether to process filled shapes"
    },
    "drawStrokes": {
      "type": "boolean",
      "default": false,
      "description": "Whether to process stroke outlines"
    }
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Usage Examples

### JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');

async function convertSvgTo3D(svgFilePath, outputPath) {
  // Step 1: Convert SVG to 3D and get download URL
  const form = new FormData();
  form.append('file', fs.createReadStream(svgFilePath));
  form.append('format', 'stl');
  form.append('depth', '2.5');
  form.append('size', '50');
  form.append('fileName', 'my-model');

  const response = await fetch('http://localhost:3000/convert', {
    method: 'POST',
    body: form
  });

  if (response.ok) {
    const result = await response.json();
    console.log('Conversion successful:', result);
    
    // Step 2: Download the file using the provided URL
    const downloadResponse = await fetch(result.downloadUrl);
    if (downloadResponse.ok) {
      const buffer = await downloadResponse.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log('3D model saved to:', outputPath);
      console.log('File size:', result.fileSize, 'bytes');
      console.log('Expires at:', result.expiresAt);
    } else {
      console.error('Download failed');
    }
  } else {
    const error = await response.json();
    console.error('Conversion failed:', error);
  }
}

// Usage
convertSvgTo3D('input.svg', 'output.stl');
```

### Python

```python
import requests

def convert_svg_to_3d(svg_file_path, output_path, format='stl'):
    # Step 1: Convert SVG to 3D and get download URL
    url = 'http://localhost:3000/convert'
    
    with open(svg_file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'format': format,
            'depth': 2,
            'size': 37,
            'fileName': 'my-model'
        }
        
        response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f'Conversion successful: {result}')
        
        # Step 2: Download the file using the provided URL
        download_response = requests.get(result['downloadUrl'])
        if download_response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(download_response.content)
            print(f'3D model saved to: {output_path}')
            print(f'File size: {result["fileSize"]} bytes')
            print(f'Expires at: {result["expiresAt"]}')
        else:
            print('Download failed')
    else:
        print(f'Conversion failed: {response.json()}')

# Usage
convert_svg_to_3d('input.svg', 'output.stl')
```

### cURL Examples

#### Convert SVG file to STL
```bash
# Step 1: Convert and get download URL
curl -X POST http://localhost:3000/convert \
  -F "file=@logo.svg" \
  -F "format=stl" \
  -F "depth=3" \
  -F "size=50" \
  -F "fileName=logo"

# Response: {"success": true, "downloadUrl": "http://localhost:3000/download/uuid", ...}

# Step 2: Download the file using the URL
curl -L "http://localhost:3000/download/uuid" --output logo.stl
```

#### Convert bitmap image to GLTF
```bash
# Step 1: Convert and get download URL
curl -X POST http://localhost:3000/convert \
  -F "file=@image.png" \
  -F "format=gltf" \
  -F "depth=2" \
  -F "size=40" \
  -F "fileName=model"

# Step 2: Download the file
curl -L "http://localhost:3000/download/uuid" --output model.gltf
```

#### Convert with inline SVG data
```bash
# Step 1: Convert and get download URL
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{
    "svgData": "<svg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" fill=\"blue\"/></svg>",
    "format": "stl",
    "depth": 2.5,
    "size": 45,
    "fileName": "rectangle"
  }'

# Step 2: Download the file
curl -L "http://localhost:3000/download/uuid" --output rectangle.stl
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/convert",
  "method": "POST"
}
```

Common error scenarios:
- **400 Bad Request**: Invalid parameters, unsupported format, or invalid SVG data
- **422 Unprocessable Entity**: SVG conversion failed
- **500 Internal Server Error**: Server-side processing error

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### File Upload Limits

- Maximum file size: 10MB
- Supported file types: SVG, PNG, JPG, JPEG, GIF, WebP

## Technical Details

### Conversion Process

1. **Input Validation**: Validate SVG data or prepare bitmap for conversion
2. **SVG Parsing**: Parse SVG using Three.js SVGLoader
3. **Shape Extraction**: Extract paths and shapes with colors
4. **3D Generation**: Create 3D geometry using ExtrudeGeometry
5. **Model Assembly**: Combine shapes into a 3D model group
6. **Scaling & Centering**: Scale to target size and center the model
7. **Export**: Export to requested format (STL/GLTF)

### Supported SVG Features

- ✅ Filled shapes (rectangles, circles, paths, etc.)
- ✅ Multiple colors per shape
- ✅ Complex paths and curves
- ✅ Nested groups
- ⚠️ Stroke outlines (limited support)
- ❌ Gradients and patterns (converted to solid colors)
- ❌ Text elements (not supported)

### Performance Considerations

- Large SVG files may take longer to process
- High curve segment counts increase processing time
- Bitmap conversion adds additional processing overhead
- Memory usage scales with model complexity

## Development

### Project Structure

```
src/
├── server.js              # Main server file
├── services/
│   └── SvgTo3DConverter.js # Core conversion logic
└── middleware/
    ├── errorHandler.js     # Error handling middleware
    └── validateSvg.js      # SVG validation middleware
```

### Adding New Export Formats

To add support for new 3D formats:

1. Install the required Three.js exporter
2. Add format configuration to `SvgTo3DConverter.js`
3. Implement export method in the converter class
4. Update API documentation

### Testing

```bash
# Run tests
npm test

# Test with sample SVG
curl -X POST http://localhost:3000/convert \
  -F "file=@test.svg" \
  -F "format=stl" \
  --output test-output.stl
```

## 🚀 Deployment

### Deploy to Render

1. **Fork this repository** to your GitHub account
2. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Sign up/Login with your GitHub account
   - Click "New +" → "Web Service"
   - Connect your forked repository

3. **Configure the service:**
   - **Name:** `svg-to-3d-api` (or your preferred name)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free tier is sufficient for testing

4. **Environment Variables (Optional):**
   - `PORT`: `3000` (Render will set this automatically)
   - `NODE_ENV`: `production`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your API will be available at `https://your-app-name.onrender.com`

### Deploy to Other Platforms

**Heroku:**
```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

**Vercel:**
```bash
# Install Vercel CLI, then:
vercel --prod
```

**Railway:**
```bash
# Install Railway CLI, then:
railway login
railway init
railway up
```

## 📊 Performance & Limits

- **File Size Limit:** 10MB per upload
- **File Expiration:** 24 hours automatic cleanup
- **Supported Formats:** SVG, PNG, JPG, JPEG, GIF, WebP
- **Output Formats:** STL, GLTF
- **Concurrent Requests:** Handles multiple simultaneous conversions

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |

### File Management

- Files are stored temporarily in memory and on disk
- Automatic cleanup every hour removes expired files
- Maximum file age: 24 hours
- Storage location: `./temp/` directory

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🆘 Support

For issues and questions:
- 📧 Create an issue in the repository
- 📖 Check the API documentation above
- 🔍 Review error messages for troubleshooting
- 🧪 Test with the provided Postman collection

## 🙏 Acknowledgments

- Built with [Three.js](https://threejs.org/) for 3D graphics
- SVG parsing powered by Three.js SVGLoader
- File management with Node.js fs and crypto modules
- Inspired by the Bekuto 3D project
