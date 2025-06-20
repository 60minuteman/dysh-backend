# Render Deployment Guide

## Why Render?
- ✅ **Easier than DigitalOcean** - Direct Git integration
- ✅ **Automatic deployments** - Deploys on every Git push
- ✅ **Built-in SSL** - HTTPS automatically configured
- ✅ **Free tier available** - Great for testing
- ✅ **Simple environment variables** - Easy to manage secrets
- ✅ **No Docker required** - Native Node.js support

## Prerequisites
- Render account (free signup)
- Git repository (GitHub/GitLab/Bitbucket)
- Your API keys ready

## Step 1: Prepare Your Repository

### 1.1 Commit and Push Your Code
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 1.2 Required Environment Variables
You'll need these API keys and secrets ready:

```bash
# Apple Sign-In Configuration
APPLE_CLIENT_ID=your.app.bundle.id
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"

# Google Sign-In Configuration
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret

# AI API Keys
OPENAI_API_KEY=sk-your_openai_key
GEMINI_API_KEY=your_gemini_key
```

*Note: JWT secrets and database credentials are automatically generated by Render*

## Step 2: Deploy to Render

### Option A: Using render.yaml (Infrastructure as Code) - RECOMMENDED

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub/GitLab repository
   - Select your repository
   - Render will detect the `render.yaml` file automatically

2. **Configure Environment Variables**
   - After deployment starts, go to your web service
   - Click "Environment" in the sidebar
   - Add your API keys (see list above)
   - **Important**: Don't set JWT_SECRET or DATABASE_URL - these are auto-generated

3. **Deploy**
   - Click "Create Services"
   - Render will automatically:
     - Create PostgreSQL database
     - Build your application
     - Run database migrations
     - Start your web service

### Option B: Manual Setup (Alternative)

1. **Create Database First**
   - Go to Render Dashboard
   - Click "New" → "PostgreSQL"
   - Name: `dysh-db`
   - Plan: Free (for testing) or Starter ($7/month)
   - Region: Oregon (recommended)
   - Click "Create Database"

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your repository
   - Configure:
     - **Name**: `dysh-backend`
     - **Environment**: Node
     - **Region**: Oregon
     - **Branch**: main
     - **Build Command**: `yarn install && yarn build`
     - **Start Command**: `node dist/main`

3. **Add Environment Variables**
   - In your web service settings:
   - Add all the API keys listed above
   - Add `DATABASE_URL` from your database's connection string
   - Generate `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ characters each)

## Step 3: Database Migrations

Render will automatically run your build command, but you need to run migrations:

### Option 1: Add Migration to Build Command (Recommended)
Update your build command in Render dashboard:
```bash
yarn install && yarn build && npx prisma migrate deploy && npx prisma generate
```

### Option 2: Manual Migration (First deployment)
1. Go to your web service in Render dashboard
2. Click "Shell" tab
3. Run:
```bash
npx prisma migrate deploy
npx prisma generate
```

## Step 4: Configure Custom Domain (Optional)

1. **In Render Dashboard**
   - Go to your web service
   - Click "Settings" → "Custom Domains"
   - Add your domain name

2. **Configure DNS**
   - Add CNAME record pointing to your Render service URL
   - Or add A record to Render's IP (provided in dashboard)

3. **SSL Certificate**
   - Render automatically provides SSL certificates
   - No additional configuration needed!

## Step 5: Environment-Specific Configuration

### Development vs Production
Your app will automatically detect the environment:
- `NODE_ENV=production` is set by default on Render
- Health check endpoint: `https://your-app.onrender.com/api/docs`

### Database Connection
- Render automatically provides `DATABASE_URL`
- No need to configure connection strings manually
- Automatic connection pooling included

## Step 6: Monitoring and Maintenance

### 6.1 Built-in Monitoring
- **Logs**: Available in Render dashboard
- **Metrics**: CPU, memory usage automatically tracked
- **Health Checks**: Automatic monitoring of `/api/docs`

### 6.2 Automatic Deployments
- Every push to `main` branch triggers deployment
- Zero-downtime deployments
- Automatic rollback on failure

### 6.3 Scaling
```bash
# In Render dashboard:
# 1. Go to your web service
# 2. Click "Settings" → "Scaling"
# 3. Increase instance count or upgrade plan
```

## Render Plans and Pricing

### Web Services
- **Free**: $0/month, limited hours, sleeps after inactivity
- **Starter**: $7/month, always on, custom domains
- **Standard**: $25/month, more resources, auto-scaling

### Database
- **Free**: $0/month, limited to 90 days, then $7/month
- **Starter**: $7/month, 1GB storage, daily backups
- **Standard**: $20/month, 10GB storage, point-in-time recovery

## Useful Commands and URLs

```bash
# Your application will be available at:
https://dysh-backend.onrender.com

# API Documentation:
https://dysh-backend.onrender.com/api/docs

# Database connection (from Render dashboard):
# Available in your database's "Info" tab
```

## Troubleshooting

### Common Issues
1. **Build fails**: Check build logs in Render dashboard
2. **Database connection error**: Verify DATABASE_URL is set correctly
3. **Environment variables**: Ensure all API keys are added
4. **Migration issues**: Run `npx prisma migrate deploy` in shell

### Debugging
```bash
# Access logs in Render dashboard or via CLI:
# 1. Install Render CLI: npm install -g @render/cli
# 2. Login: render login
# 3. View logs: render logs -s your-service-name
```

## Security Best Practices

### Environment Variables
- ✅ Never commit API keys to repository
- ✅ Use Render's environment variables feature
- ✅ Different secrets for each environment
- ✅ Regular rotation of JWT secrets

### Database Security
- ✅ Database automatically secured with SSL
- ✅ Connection strings include security tokens
- ✅ Regular backups enabled
- ✅ Access restricted to your services only

## Migration from Other Platforms

### From DigitalOcean
1. Export your database: `pg_dump your_database > backup.sql`
2. Import to Render database via dashboard or CLI
3. Update environment variables
4. Deploy code to Render

### Environment Variable Mapping
```bash
# DigitalOcean → Render
DATABASE_URL → Same (auto-generated by Render)
PORT → 10000 (Render default)
NODE_ENV → production (auto-set by Render)
```

## Quick Start Summary

1. **Push code** to GitHub/GitLab
2. **Connect repository** to Render Blueprint
3. **Add environment variables** (API keys only)
4. **Deploy** - Render handles the rest!
5. **Access app** at your Render URL

That's it! Much simpler than traditional deployment methods. 🚀 