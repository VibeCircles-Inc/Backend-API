# VibeCircles Backend Deployment Guide

This guide will walk you through deploying the VibeCircles backend to GitHub and Render step by step.

## Prerequisites

- GitHub account
- Render account (free tier available)
- MySQL database (can use Render's MySQL add-on or external service)
- Node.js installed locally for testing

## Step 1: Prepare Your Local Environment

### 1.1 Install Dependencies
```bash
cd backend
npm install
```

### 1.2 Set Up Environment Variables
```bash
cp env.example .env
```

Edit `.env` file with your local development settings:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vibecircles
DB_USER=root
DB_PASSWORD=your_local_password
JWT_SECRET=your-local-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 1.3 Test Locally
```bash
npm run dev
```

Visit `http://localhost:3000/health` to verify the server is running.

## Step 2: Set Up GitHub Repository

### 2.1 Initialize Git (if not already done)
```bash
# From the project root directory
git init
git add .
git commit -m "Initial commit: VibeCircles backend"
```

### 2.2 Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name it `vibecircles-backend` (or your preferred name)
4. Make it public or private
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### 2.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/vibecircles-backend.git
git branch -M main
git push -u origin main
```

## Step 3: Set Up Database

### Option A: Render MySQL Add-on (Recommended for beginners)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create MySQL Database**
   - In Render dashboard, click "New +"
   - Select "MySQL"
   - Choose "Starter" plan (free tier)
   - Name it `vibecircles-db`
   - Click "Create Database"

3. **Get Database Credentials**
   - Click on your database
   - Copy the connection details:
     - Host
     - Port
     - Database name
     - Username
     - Password

### Option B: External MySQL Service

You can use any MySQL service like:
- PlanetScale
- Railway
- AWS RDS
- DigitalOcean Managed Databases

## Step 4: Deploy to Render

### 4.1 Connect Repository
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Select the `vibecircles-backend` repository

### 4.2 Configure Service
- **Name**: `vibecircles-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4.3 Set Environment Variables
Click "Environment" tab and add these variables:

```env
NODE_ENV=production
PORT=10000
DB_HOST=your-render-mysql-host
DB_PORT=3306
DB_NAME=vibecircles
DB_USER=your-render-mysql-user
DB_PASSWORD=your-render-mysql-password
JWT_SECRET=your-super-secret-production-jwt-key
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-production-session-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

**Important Security Notes:**
- Generate a strong JWT_SECRET (you can use `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- Generate a strong SESSION_SECRET
- Set CORS_ORIGIN to your frontend domain

### 4.4 Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Wait for the build to complete (usually 2-5 minutes)

## Step 5: Set Up Database Schema

### 5.1 Import Schema
1. Get your database connection details from Render
2. Use a MySQL client (like MySQL Workbench, phpMyAdmin, or command line)
3. Connect to your database
4. Import the schema from `../vibecircles_schema.sql`

### 5.2 Verify Database Connection
Your backend should automatically connect to the database on startup. Check the logs in Render dashboard to ensure connection is successful.

## Step 6: Test Your Deployment

### 6.1 Health Check
Visit your Render URL + `/health`:
```
https://your-app-name.onrender.com/health
```

You should see:
```json
{
  "status": "OK",
  "message": "VibeCircles API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 6.2 Test API Endpoints
Use a tool like Postman or curl to test your endpoints:

```bash
# Test registration
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Step 7: Configure Custom Domain (Optional)

### 7.1 Add Custom Domain in Render
1. Go to your web service settings
2. Click "Custom Domains"
3. Add your domain
4. Update your DNS records as instructed

### 7.2 Update CORS Settings
Update the `CORS_ORIGIN` environment variable to include your custom domain.

## Step 8: Set Up Continuous Deployment

### 8.1 Automatic Deployments
Render automatically deploys when you push to the main branch. To test:

1. Make a small change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push
   ```
3. Check Render dashboard to see the new deployment

### 8.2 Environment-Specific Deployments
For different environments (staging, production), you can:
- Create different branches
- Set up multiple Render services
- Use environment variables to configure behavior

## Step 9: Monitoring and Maintenance

### 9.1 Monitor Logs
- Check Render dashboard for application logs
- Set up log aggregation if needed

### 9.2 Set Up Alerts
- Configure health check alerts
- Monitor database performance

### 9.3 Backup Strategy
- Enable automatic database backups in Render
- Consider additional backup solutions

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build logs in Render
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Database Connection Fails**
   - Verify database credentials
   - Check if database is accessible from Render
   - Ensure database schema is imported

3. **Environment Variables Not Working**
   - Double-check variable names
   - Restart the service after adding variables
   - Check for typos

4. **CORS Errors**
   - Verify CORS_ORIGIN setting
   - Check frontend domain configuration

### Getting Help

- Check Render documentation: [docs.render.com](https://docs.render.com)
- Review application logs in Render dashboard
- Test locally to isolate issues

## Next Steps

1. **Set up frontend deployment** to connect with your backend
2. **Configure SSL certificates** (automatic with Render)
3. **Set up monitoring and analytics**
4. **Implement CI/CD pipelines**
5. **Add automated testing**

## Security Checklist

- [ ] Strong JWT secret generated
- [ ] Strong session secret generated
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] HTTPS enabled (automatic with Render)

Your VibeCircles backend is now deployed and ready to serve your social media platform! 🚀
