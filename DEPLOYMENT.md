# 🚀 Deployment Guide

This guide will help you deploy the SVG to 3D API to various cloud platforms.

## 📋 Prerequisites

- GitHub account
- Node.js project (this repository)
- Basic understanding of cloud deployment

## 🌟 Recommended: Render (Free Tier)

Render is the easiest and most cost-effective option for deploying this API.

### Step 1: Prepare Your Repository

1. **Fork this repository** to your GitHub account
2. **Ensure your code is committed** and pushed to GitHub

### Step 2: Deploy to Render

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New +" → "Web Service"**
4. **Connect your repository:**
   - Select your forked repository
   - Choose the main branch

5. **Configure the service:**
   ```
   Name: svg-to-3d-api (or your preferred name)
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

6. **Environment Variables (Optional):**
   ```
   NODE_ENV = production
   PORT = 3000 (Render sets this automatically)
   ```

7. **Click "Create Web Service"**
8. **Wait for deployment** (usually 2-5 minutes)

### Step 3: Test Your Deployment

Once deployed, your API will be available at:
```
https://your-app-name.onrender.com
```

Test the health endpoint:
```bash
curl https://your-app-name.onrender.com/health
```

## 🔄 Alternative Platforms

### Heroku

1. **Install Heroku CLI**
2. **Login and create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   ```

### Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configure in Vercel dashboard:**
   - Build Command: `npm install`
   - Output Directory: `.`
   - Install Command: `npm install`

### Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

## ⚙️ Production Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |

### Performance Optimization

1. **Enable compression** (already configured)
2. **Set up monitoring** (optional)
3. **Configure logging** (optional)

### Security Considerations

- ✅ CORS is configured
- ✅ Helmet security headers enabled
- ✅ File upload size limits (10MB)
- ✅ Input validation and sanitization
- ✅ Automatic file cleanup

## 📊 Monitoring & Maintenance

### Health Checks

The API includes a health check endpoint:
```
GET /health
```

### File Cleanup

- Files automatically expire after 24 hours
- Cleanup runs every hour
- No manual intervention required

### Logs

Monitor your deployment logs for:
- Conversion success/failure rates
- File generation statistics
- Error patterns

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Verify build commands

2. **Runtime Errors:**
   - Check environment variables
   - Monitor memory usage
   - Review error logs

3. **File Generation Issues:**
   - Verify SVG input format
   - Check file size limits
   - Monitor disk space

### Getting Help

- Check the main README.md for API documentation
- Review error messages in deployment logs
- Test locally first before deploying
- Use the provided Postman collection for testing

## 🎯 Post-Deployment Checklist

- [ ] Health endpoint responds correctly
- [ ] SVG to STL conversion works
- [ ] File downloads work
- [ ] Error handling works
- [ ] File cleanup is functioning
- [ ] Performance is acceptable

## 📈 Scaling Considerations

### Free Tier Limits

- **Render Free:** 750 hours/month, sleeps after 15 min inactivity
- **Heroku Free:** 550-1000 dyno hours/month
- **Vercel Free:** 100GB bandwidth/month

### Upgrade Options

When you need more resources:
- Upgrade to paid plans
- Consider dedicated servers
- Implement caching strategies
- Add load balancing

## 🔒 Security Best Practices

1. **Keep dependencies updated**
2. **Monitor for security vulnerabilities**
3. **Use HTTPS in production**
4. **Implement rate limiting** (if needed)
5. **Regular security audits**

Your API is now ready for production use! 🎉
