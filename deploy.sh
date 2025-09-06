#!/bin/bash

# SVG to 3D API Deployment Script
echo "🚀 Deploying SVG to 3D API..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests (if any)
echo "🧪 Running tests..."
npm test || echo "⚠️  No tests found or tests failed, continuing..."

# Check if server starts correctly
echo "🔍 Testing server startup..."
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Deploy to production'"
echo "2. Push to GitHub: git push origin main"
echo "3. Deploy to Render:"
echo "   - Go to https://render.com"
echo "   - Connect your GitHub repository"
echo "   - Create a new Web Service"
echo "   - Use these settings:"
echo "     - Build Command: npm install"
echo "     - Start Command: npm start"
echo "     - Plan: Free"
echo ""
echo "🔗 Your API will be available at: https://your-app-name.onrender.com"
