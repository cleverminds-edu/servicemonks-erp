# Railway Deployment Guide - ServiceMonks ERP

This guide will walk you through deploying the ServiceMonks ERP application to Railway.

## Prerequisites

1. A Railway account (https://railway.app)
2. Railway CLI installed (`npm i -g @railway/cli` or download from https://railway.app/download)
3. Git repository initialized with all changes committed
4. All sensitive data removed from repository (use `.env` files instead)

## Step 1: Prepare for Production

### 1.1 Verify Security Configuration

Before deploying, ensure:

```bash
# Check for exposed secrets
git log --all --full-history --oneline | head -20
# If you see commits with .env files, they must be cleaned

# Verify .gitignore is in place
cat .gitignore | grep -E "\.env|uploads/"
# Output should show .env patterns

# Verify secret key is NOT hardcoded
grep -r "change-this-secret-key" backend/
# Should return nothing - only show placeholder in .env.example
```

### 1.2 Update Environment Variables

```bash
# Copy example files
cp backend/.env.example backend/.env.production.example
cp frontend/.env.example frontend/.env.production.example

# DO NOT edit .env or commit it - will be handled by Railway
```

## Step 2: Create Railway Project

### 2.1 Login to Railway

```bash
railway login
# This opens a browser for authentication
# Or use: railway login --browserless
```

### 2.2 Create Project

```bash
railway init
# Follow prompts to create a new project
# Name: servicemonks-erp
# Region: Choose closest to your customers
```

## Step 3: Add Services to Railway

### 3.1 Add PostgreSQL Database

```bash
railway add
# Select: PostgreSQL
# This creates a DATABASE_URL environment variable automatically
```

Verify the database service:

```bash
railway status
# You should see: postgres | PostgreSQL <version>
```

### 3.2 Add Backend Service

```bash
# Build and deploy backend
railway up --name backend --service backend --dockerfile ./backend/Dockerfile
```

Or use Railway dashboard:
1. Go to railway.app dashboard
2. Click "+ Add Service"
3. Select "GitHub Repo"
4. Choose your repository
5. Select "Docker" deployment option
6. Set Root Directory: `backend`
7. Set Dockerfile: `./backend/Dockerfile`

### 3.3 Add Frontend Service

Similarly add frontend:
1. "+ Add Service"
2. GitHub Repo → your repo
3. Docker
4. Root Directory: `frontend`
5. Set Build Command: `npm ci && npm run build`
6. Set Start Command: Leave default (nginx)
7. Port: 80 (auto-redirects to HTTPS)

## Step 4: Configure Environment Variables

### 4.1 Backend Environment Variables

In Railway Dashboard → Backend Service → Variables:

```
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
SECRET_KEY=<generate-new-random-key>
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password (not regular password)
SMTP_FROM_NAME=Service Monks
NOTIFICATION_EMAIL=team@servicemonks.com
RATE_PER_KM=5.0
MAX_SIGNATURE_SIZE_KB=500
```

**Generating SECRET_KEY:**

```python
import secrets
print(secrets.token_urlsafe(32))
```

### 4.2 Frontend Environment Variables

In Railway Dashboard → Frontend Service → Variables:

```
VITE_GOOGLE_MAPS_KEY=<your-api-key-restricted-to-domain>
VITE_API_URL=https://api.yourdomain.com
```

Or for Railway internal networking:

```
VITE_API_URL=http://backend.railway.internal:8000
BACKEND_URL=http://backend.railway.internal:8000
```

## Step 5: Database Setup

### 5.1 Create Database and Run Migrations

In Railway Dashboard → Postgres Service → Data:

1. Click "Connect" to open database console
2. Create initial schema (if using table creation on startup):

The FastAPI startup event will automatically run:
```python
Base.metadata.create_all(bind=engine)
seed_service_types()
seed_admin_user()
```

### 5.2 Default Admin User

After first deployment, log in with:
- **Employee ID:** ADMIN
- **Password:** admin123

**IMPORTANT:** Change this password immediately in production!

## Step 6: Setup Custom Domain

### 6.1 Point Domain to Railway

In Railway Dashboard:
1. Select Frontend Service
2. Click "Settings"
3. Click "+ Add Domain"
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Follow DNS instructions to add CNAME record

Railway automatically handles SSL/TLS (HTTPS).

### 6.2 Backend Domain (Optional)

If you need a separate API domain:
1. Add domain to Backend Service as well
2. Update frontend `VITE_API_URL` to point to it

Or use Railway's internal networking:
```
VITE_API_URL=http://backend.railway.internal:8000
```

## Step 7: Setup File Storage

### Option A: Railway Volumes (Simple)

In Railway Dashboard → Backend Service:
1. Click "Volumes"
2. Click "+ Add Volume"
3. Mount Path: `/app/uploads`
4. Size: 10GB (or as needed)

PDFs and signatures persist across deployments.

### Option B: AWS S3 (Scalable)

For multi-instance or large-scale:

1. **Create S3 Bucket:**
   - Region: same as your Railway region
   - Block public access
   - Enable versioning

2. **Create IAM User:**
   - Policy: S3 bucket access
   - Get Access Key ID and Secret Access Key

3. **Update Backend Variables:**
   ```
   AWS_ACCESS_KEY_ID=<your-key>
   AWS_SECRET_ACCESS_KEY=<your-secret>
   AWS_REGION=us-east-1
   S3_BUCKET=servicemonks-pdfs
   ```

4. **Code Changes:**
   ```python
   # In backend/app/config.py
   aws_access_key: str = ""
   aws_secret_access_key: str = ""
   aws_region: str = "us-east-1"
   s3_bucket: str = "servicemonks-pdfs"
   
   # Update utils/pdf.py to use S3 instead of local filesystem
   ```

## Step 8: Email Configuration

### Gmail Setup

1. Enable 2FA on Gmail account
2. Generate App Password:
   - Account Settings → Security → App Passwords
   - Select "Mail" and "Windows Computer"
   - Copy generated password

3. Set in Railway:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=<16-char-app-password>
   ```

### SendGrid Alternative

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
```

## Step 9: Deploy

### 9.1 Deploy via Git

```bash
git push origin main
# Railway auto-deploys when you push to connected branch
```

### 9.2 Monitor Deployment

In Railway Dashboard:
1. View logs in real-time
2. Check for startup errors
3. Verify health check passes

```bash
# Or via CLI
railway logs -f
```

## Step 10: Verify Production

### 10.1 Health Check

```bash
curl https://api.yourdomain.com/health
# Should return: {"status":"ok","database":"ok",...}
```

### 10.2 Login Test

1. Visit https://yourdomain.com
2. Login with credentials:
   - Employee ID: ADMIN
   - Password: admin123 (change immediately!)

### 10.3 Submit Test Job

1. Create a test customer
2. Create a test job
3. Check in and submit with signature
4. Verify PDF generated
5. Check email received

## Step 11: Monitoring & Maintenance

### 11.1 Enable Monitoring

In Railway Dashboard:
1. Go to Alerts
2. Enable notifications for:
   - Deployment failures
   - High CPU/Memory usage
   - Crashes

### 11.2 Database Backups

Railway automatically backs up PostgreSQL. To download:

1. Dashboard → Postgres Service → Settings
2. Click "Backup" tab
3. Download backup files

### 11.3 View Logs

```bash
# Backend logs
railway logs -f --service backend

# Frontend logs
railway logs -f --service frontend

# Database logs
railway logs -f --service postgres
```

## Troubleshooting

### Issue: 404 on API endpoints

**Solution:** Check CORS configuration
- Verify ALLOWED_ORIGINS includes your frontend domain
- Check frontend is using correct BACKEND_URL
- Restart both services

### Issue: Signature upload fails

**Ensure volume/storage is mounted:**
- Check `/app/uploads` volume exists
- Verify folder permissions
- Check disk space: `railway exec du -sh /app/uploads`

### Issue: Email not sending

**Check SMTP credentials:**
```bash
# View backend logs for email errors
railway logs -f --service backend | grep -i email

# Test SMTP connectivity (in backend pod)
railway exec telnet smtp.gmail.com 587
```

### Issue: Database connection timeout

**Check connection:**
```bash
railway exec psql $DATABASE_URL -c "SELECT 1"
```

### Issue: 502 Bad Gateway

**Backend likely crashed. Check:**
```bash
railway logs -f --service backend
# Look for errors in startup
```

## Performance Optimization (Later)

Once stable, consider:

1. **Caching:**
   - Redis for session management
   - CloudFlare for static assets

2. **CDN:**
   - Cloudflare/AWS CloudFront for PDFs

3. **Database:**
   - Enable read replicas
   - Index optimization

4. **Scaling:**
   - Horizontal scaling (multiple backend instances)
   - Load balancing

## Rollback

If deployment causes issues:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback in Railway Dashboard:
# Click "Deployments" → select previous → "Redeploy"
```

## Next Steps

1. ✅ Update admin password
2. ✅ Create actual users in database
3. ✅ Setup production Google Maps API key (restricted to domain)
4. ✅ Configure backup schedule
5. ✅ Setup monitoring/alerting
6. ✅ Test disaster recovery procedure

## Support

For Railway-specific issues:
- https://railway.app/docs
- https://railway.app/community

For ServiceMonks ERP issues:
- Check PRODUCTION_AUDIT_REPORT.md
- Review application logs
