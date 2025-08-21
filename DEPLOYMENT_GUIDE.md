# VibeCircles Backend Deployment Guide

This guide will walk you through setting up your VibeCircles backend project on GitHub and deploying it to Render.

## Prerequisites

Before starting, make sure you have:
- [ ] Node.js installed (v18 or higher)
- [ ] Git installed
- [ ] A GitHub account
- [ ] A Render account
- [ ] A Supabase account and project set up

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the details:
   - **Name**: `vibecircles`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
4. Click "Create new project"
5. Wait for project to be created (2-3 minutes)

### 1.2 Get Project Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy the following information:
   - **Project URL**
   - **Anon Public Key**
   - **Service Role Key** (keep this secret!)
3. Save these in a secure location

### 1.3 Set Up Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Run the schema from `../database/schema/vibecircles_schema.sql`
3. Run the sample data from `../database/schema/sample_data.sql`
4. Follow the RLS setup instructions in `../database/deployment/supabase-setup.md`

## Step 2: Prepare Your Local Project

### 2.1 Initialize Git Repository

```bash
# Navigate to your project root
cd vibecircles

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: VibeCircles social media platform"
```

### 2.2 Set Up Environment Variables

1. Copy the environment example file:
   ```bash
   cd backend
   cp env.example .env
   ```

2. Edit the `.env` file with your Supabase credentials:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key

   # JWT Configuration
   JWT_SECRET=your_very_secure_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

### 2.3 Test Local Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000/health` to verify the server is running.

## Step 3: Set Up GitHub Repository

### 3.1 Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Fill in the details:
   - **Repository name**: `vibecircles`
   - **Description**: VibeCircles social media platform
   - **Visibility**: Choose Public or Private
   - **Initialize with**: Don't initialize (we already have files)
4. Click "Create repository"

### 3.2 Push Code to GitHub

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/vibecircles.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3.3 Create .gitignore File

Create a `.gitignore` file in your project root:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Uploads directory
uploads/

# Build outputs
dist/
build/
```

### 3.4 Commit and Push .gitignore

```bash
git add .gitignore
git commit -m "Add .gitignore file"
git push
```

## Step 4: Deploy to Render

### 4.1 Create Render Account

1. Go to [render.com](https://render.com) and sign up
2. You can sign up with GitHub for easier integration

### 4.2 Connect GitHub Repository

1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account if not already connected
4. Select your `vibecircles` repository

### 4.3 Configure Web Service

Fill in the service configuration:

- **Name**: `vibecircles-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Plan**: Free (or choose paid plan for production)

### 4.4 Set Environment Variables

Click on "Environment" tab and add these variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render's default) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Your Supabase service key |
| `JWT_SECRET` | Your secure JWT secret |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | Your frontend URL (e.g., `https://yourdomain.com`) |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |

### 4.5 Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Wait for the build to complete (usually 2-5 minutes)
4. Your API will be available at: `https://your-service-name.onrender.com`

## Step 5: Test Deployment

### 5.1 Test Health Endpoint

Visit your deployed API health endpoint:
```
https://your-service-name.onrender.com/health
```

You should see:
```json
{
  "success": true,
  "message": "VibeCircles API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 5.2 Test API Endpoints

Use a tool like Postman or curl to test your endpoints:

```bash
# Test user registration
curl -X POST https://your-service-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123",
    "fullName": "Test User"
  }'
```

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Add Custom Domain in Render

1. Go to your web service in Render
2. Click "Settings" tab
3. Scroll to "Custom Domains"
4. Click "Add Domain"
5. Enter your domain (e.g., `api.yourdomain.com`)
6. Follow the DNS configuration instructions

### 6.2 Configure DNS

Add a CNAME record in your domain provider:
- **Name**: `api` (or whatever subdomain you want)
- **Value**: `your-service-name.onrender.com`

### 6.3 Update CORS Settings

Update your `CORS_ORIGIN` environment variable to include your custom domain.

## Step 7: Continuous Deployment

### 7.1 Automatic Deployments

Render automatically deploys when you push to your main branch. To deploy:

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main
```

### 7.2 Manual Deployments

You can also manually deploy from the Render dashboard:
1. Go to your web service
2. Click "Manual Deploy"
3. Select the branch to deploy

## Step 8: Monitoring and Maintenance

### 8.1 Monitor Logs

1. In Render dashboard, go to your web service
2. Click "Logs" tab
3. Monitor for errors and performance issues

### 8.2 Set Up Alerts

1. Go to "Settings" > "Alerts"
2. Configure alerts for:
   - Failed deployments
   - High error rates
   - Performance issues

### 8.3 Database Monitoring

1. In Supabase dashboard, go to "Database" > "Logs"
2. Monitor query performance
3. Set up alerts for unusual activity

## Troubleshooting

### Common Issues

#### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs in Render dashboard

#### Environment Variables
- Ensure all required variables are set in Render
- Check for typos in variable names
- Verify Supabase credentials are correct

#### CORS Errors
- Update `CORS_ORIGIN` to include your frontend domain
- Check that the frontend is making requests to the correct API URL

#### Database Connection Issues
- Verify Supabase project is active
- Check API keys are correct
- Ensure RLS policies are configured properly

### Getting Help

1. Check Render documentation: [docs.render.com](https://docs.render.com)
2. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
3. Review your application logs in Render dashboard
4. Check Supabase logs for database issues

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to Git
- Use strong, unique secrets for JWT
- Rotate secrets regularly

### 2. Database Security
- Use Row Level Security (RLS) in Supabase
- Limit database access with proper policies
- Monitor database access logs

### 3. API Security
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use proper CORS configuration

### 4. Monitoring
- Set up alerts for security events
- Monitor API usage patterns
- Log security-relevant events

## Next Steps

After successful deployment:

1. **Frontend Integration**: Update your frontend to use the deployed API
2. **Domain Setup**: Configure custom domain for production
3. **SSL Certificate**: Ensure HTTPS is properly configured
4. **Backup Strategy**: Set up database backups
5. **Performance Optimization**: Monitor and optimize performance
6. **Scaling**: Plan for scaling as your user base grows

## Support

For additional help:
- Render Support: [render.com/support](https://render.com/support)
- Supabase Support: [supabase.com/support](https://supabase.com/support)
- GitHub Issues: Create an issue in your repository

---

**Congratulations!** Your VibeCircles backend is now deployed and ready to serve your social media platform! 🎉
