# Postman Testing Guide for SVG to 3D API

This guide will help you test your SVG to 3D API using Postman.

## 📁 Files Included

- `SVG-to-3D-API.postman_collection.json` - Complete Postman collection with all API endpoints
- `SVG-to-3D-API.postman_environment.json` - Environment variables for easy configuration
- `test-files/test-logo.svg` - Sample SVG file for testing

## 🚀 Quick Setup

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import both files:
   - `SVG-to-3D-API.postman_collection.json`
   - `SVG-to-3D-API.postman_environment.json`
4. Select the **SVG to 3D API Environment** from the environment dropdown

### 2. Start Your API Server

```bash
cd svg-to-3d-api
npm install
npm start
```

Your API should be running at `http://localhost:3000`

## 🧪 Testing Workflow

### Step 1: Basic Health Check
1. Run **Health Check** request
2. Should return: `{"status": "healthy", "timestamp": "...", "version": "1.0.0"}`

### Step 2: Get API Information
1. Run **Get Supported Formats** - See available export formats
2. Run **Get Conversion Options** - See all parameters and their ranges
3. Run **Get File Manager Stats** - Check current file storage status

### Step 3: Test SVG Conversion
1. Run **Convert SVG to STL (File Upload)** or **Convert SVG to STL (Inline Data)**
2. Check the response for:
   ```json
   {
     "success": true,
     "fileId": "uuid-string",
     "downloadUrl": "http://localhost:3000/download/uuid-string",
     "format": "STL",
     "fileName": "test-model.stl",
     "fileSize": 12345,
     "expiresAt": "2024-01-02T00:00:00.000Z"
   }
   ```

### Step 4: Download Generated File
1. Run **Download Generated File** (uses the fileId from previous response)
2. Or run **Download Using URL** (uses the direct download URL)
3. The response should be binary data (STL/GLTF file)

### Step 5: Test Error Handling
1. Run **Test Invalid SVG Data** - Should return 400 error
2. Run **Test Unsupported Format** - Should return 400 error
3. Run **Test Invalid Parameters** - Should return 400 error
4. Run **Test Missing SVG Data** - Should return 400 error
5. Run **Test Download Non-existent File** - Should return 404 error

## 📋 Request Details

### File Upload Requests
- Use the `test-logo.svg` file included in the `test-files` folder
- Or upload your own SVG/image files
- Supported formats: SVG, PNG, JPG, JPEG, GIF, WebP

### Inline Data Requests
- SVG data is provided as JSON in the request body
- Use the sample SVG data in the collection or create your own

### Parameters to Test
- **format**: `stl`, `gltf`
- **depth**: `0.1` to `10` (mm)
- **size**: `1` to `1000` (mm)
- **curveSegments**: `4` to `256`
- **defaultColor**: Any valid hex color (e.g., `#FFA500`)
- **fileName**: Custom name for the generated file

## 🔍 What to Look For

### Successful Conversion Response
```json
{
  "success": true,
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "downloadUrl": "http://localhost:3000/download/550e8400-e29b-41d4-a716-446655440000",
  "format": "STL",
  "extension": "stl",
  "mimeType": "application/octet-stream",
  "fileName": "test-model.stl",
  "fileSize": 12345,
  "expiresAt": "2024-01-02T00:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/convert",
  "method": "POST"
}
```

### Download Response
- **Content-Type**: `application/octet-stream`
- **Content-Disposition**: `attachment; filename="model.stl"`
- **Body**: Binary file data

## 🎯 Test Scenarios

### 1. Basic Functionality
- [ ] Health check works
- [ ] Can get supported formats
- [ ] Can get conversion options
- [ ] Can convert SVG to STL
- [ ] Can convert SVG to GLTF
- [ ] Can download generated files

### 2. File Upload
- [ ] SVG file upload works
- [ ] PNG image upload works (converts to SVG first)
- [ ] Custom file names work
- [ ] Different parameters work

### 3. Inline Data
- [ ] Simple SVG data works
- [ ] Complex SVG with multiple shapes works
- [ ] SVG with different colors works
- [ ] SVG with transparency works

### 4. Parameters
- [ ] Different depths (0.1, 1, 5, 10)
- [ ] Different sizes (10, 50, 100, 500)
- [ ] Different curve segments (4, 16, 64, 256)
- [ ] Different colors (#FF0000, #00FF00, #0000FF)

### 5. Error Handling
- [ ] Invalid SVG data returns 400
- [ ] Unsupported format returns 400
- [ ] Invalid parameters return 400
- [ ] Missing data returns 400
- [ ] Non-existent file download returns 404

### 6. File Management
- [ ] Files are generated with unique IDs
- [ ] Download URLs work
- [ ] Files expire after 24 hours
- [ ] File statistics are accurate

## 🐛 Troubleshooting

### Common Issues

1. **Server not running**
   - Make sure you've started the API server with `npm start`
   - Check that it's running on port 3000

2. **File upload not working**
   - Make sure the test SVG file exists in the `test-files` folder
   - Check file permissions

3. **Download fails**
   - Make sure you've run a conversion request first
   - Check that the fileId variable is set correctly

4. **Invalid SVG errors**
   - Make sure your SVG has proper viewBox, width, or height attributes
   - Check that the SVG is well-formed XML

### Debug Tips

1. **Check Console Logs**
   - Look at the Postman console for detailed request/response info
   - Check the API server console for error messages

2. **Verify Variables**
   - Make sure the `baseUrl` environment variable is set correctly
   - Check that `fileId` and `downloadUrl` are populated after conversion

3. **Test Step by Step**
   - Start with health check
   - Then test basic conversion
   - Finally test download

## 📊 Performance Testing

### Load Testing
- Run multiple conversion requests simultaneously
- Test with different file sizes
- Monitor file manager statistics

### File Size Testing
- Test with small SVG files (< 1KB)
- Test with large SVG files (> 100KB)
- Test with complex SVG files (many shapes)

## 🎉 Success Criteria

Your API is working correctly if:
- ✅ All health checks pass
- ✅ SVG to STL conversion works
- ✅ SVG to GLTF conversion works
- ✅ File downloads work
- ✅ Error handling works for invalid inputs
- ✅ File management works (unique IDs, expiration)
- ✅ All parameters work within their valid ranges

## 📝 Notes

- Files are automatically cleaned up after 24 hours
- Each conversion generates a unique file ID
- Download URLs can be used multiple times until expiration
- The API supports both file upload and inline SVG data
- Bitmap images (PNG, JPG) are automatically converted to SVG first
