# Railway Deployment - Step-by-Step Guide
**Status:** Ready to Deploy  
**Date:** June 15, 2026  
**Git Commit:** 8b31650 (Initial commit with security hardening)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before starting, ensure you have:

- [ ] Railway account (https://railway.app - Sign up if needed)
- [ ] GitHub account with this repository pushed to it
- [ ] Production SECRET_KEY generated
- [ ] SMTP credentials (Gmail app password or SendGrid)
- [ ] Google Maps API key (with domain restrictions)
- [ ] Custom domain (optional but recommended)

---

## 🔑 STEP 1: Generate Production Secrets

### 1A: Generate SECRET_KEY

```bash
# Option 1: Using Python (run in terminal)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# You'll get output like:
# jR8k9vL_c2xQmP5nF7yZ_hJ3qW6mT4zX9_aB0dC5eF

# Save this key - you'll need it for Railway
```

**Store this key securely!**

### 1B: Get SMTP Credentials

**Option A: Gmail (Recommended)**

1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if not already enabled)
3. Go to App Passwords (https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows Computer"
5. Generate password (looks like: `abcd efgh ijkl mnop`)
6. Copy the 16-character password

**Option B: SendGrid**

1. Go to https://sendgrid.com/
2. Create account and get API key
3. Use `apikey` as SMTP_USER and API key as SMTP_PASSWORD

### 1C: Get Google Maps API Key

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "Maps JavaScript API"
4. Create API key (Credentials)
5. Restrict to your domain (if using custom domain)

---

## 📦 STEP 2: Set Up GitHub Repository

### 2A: Create GitHub Repository

```bash
# Go to https://github.com/new
# Create new repository:
# - Name: servicemonks-erp
# - Description: Service Monks ERP with security hardening
# - Public or Private (your choice)
# - Click "Create repository"
```

### 2B: Push Code to GitHub

```bash
# Copy the commands from GitHub after creating repo
# It will look like this:

git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/servicemonks-erp.git
git push -u origin main

# If you get asked for password, use GitHub token:
# 1. Go to https://github.com/settings/tokens
# 2. Generate new token (classic)
# 3. Check "repo" permissions
# 4. Use as password in terminal
```

**Verify it pushed:**
```bash
git remote -v
# Should show:
# origin  https://github.com/YOUR-USERNAME/servicemonks-erp.git (fetch)
# origin  https://github.com/YOUR-USERNAME/servicemonks-erp.git (push)
```

---

## 🚂 STEP 3: Create Railway Project

### 3A: Login to Railway

**Option 1: Web Dashboard (Easier)**
1. Go to https://railway.app
2. Sign up or log in
3. Click "Create New Project"

**Option 2: Railway CLI (Advanced)**
```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login
railway login
# Opens browser for authentication
```

### 3B: Connect GitHub Repository

**In Railway Dashboard:**
1. Click "Create New Project"
2. Select "GitHub Repo"
3. Select your repository: `YOUR-USERNAME/servicemonks-erp`
4. Confirm authorization
5. Select branch: `main`

---

## 🗄️ STEP 4: Add PostgreSQL Database

**In Railway Dashboard:**

1. Click "+ Add Service"
2. Search for "PostgreSQL"
3. Click "PostgreSQL" from results
4. Click "Deploy"
5. Wait for database to initialize (2-3 minutes)

**Verify Database:**
- You should see a PostgreSQL service in your project
- A `DATABASE_URL` environment variable is automatically created

---

## 🔧 STEP 5: Add Backend Service

**In Railway Dashboard:**

1. Click "+ Add Service"
2. Select "GitHub Repo"
3. Choose your repository
4. Configuration:
   - **Root Directory:** `backend`
   - **Dockerfile:** `./Dockerfile` (Railway auto-detects)
   - **Build Command:** (Leave default)
   - **Start Command:** (Leave default - uses Dockerfile)
   - **Port:** 8000
5. Click "Deploy"

**Wait for backend to build** (3-5 minutes)

---

## 🌐 STEP 6: Add Frontend Service

**In Railway Dashboard:**

1. Click "+ Add Service"
2. Select "GitHub Repo"
3. Choose your repository
4. Configuration:
   - **Root Directory:** `frontend`
   - **Dockerfile:** `./Dockerfile`
   - **Build Command:** (Leave default)
   - **Start Command:** (Leave default - uses Dockerfile/Nginx)
   - **Port:** 80
5. Click "Deploy"

**Wait for frontend to build** (2-3 minutes)

---

## 🔑 STEP 7: Configure Environment Variables

### 7A: Backend Environment Variables

**In Railway Dashboard → Backend Service → Variables:**

Click "New Variable" for each:

```
ENVIRONMENT = production

DATABASE_URL = [This is auto-created by Railway - copy from there]
SECRET_KEY = [Your generated key from Step 1A]

ACCESS_TOKEN_EXPIRE_MINUTES = 1440

ALLOWED_ORIGINS = https://YOUR-DOMAIN.com,https://www.YOUR-DOMAIN.com
(Or if using Railway's auto-generated domain, get it from Frontend service)

SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = [16-char password from Step 1B]
SMTP_FROM_NAME = Service Monks
NOTIFICATION_EMAIL = team@yourdomain.com

RATE_PER_KM = 5.0
MAX_SIGNATURE_SIZE_KB = 500
```

**Finding DATABASE_URL:**
- Go to PostgreSQL service in Railway
- Click "Connect"
- Copy the full connection string starting with `postgresql://`

### 7B: Frontend Environment Variables

**In Railway Dashboard → Frontend Service → Variables:**

```
VITE_GOOGLE_MAPS_KEY = [Your API key from Step 1C]

VITE_API_URL = https://api.YOUR-DOMAIN.com
(Or use Railway's backend internal URL: http://backend.railway.internal:8000)
```

**To use Railway internal networking** (faster, more secure):
```
VITE_API_URL = http://backend.railway.internal:8000
```

---

## 🌍 STEP 8: Setup Custom Domain (Optional)

### 8A: Add Domain to Frontend

**In Railway Dashboard → Frontend Service:**

1. Click "Settings"
2. Find "Domains" section
3. Click "+ Add Domain"
4. Enter your domain: `app.yourdomain.com`
5. Copy the CNAME value Railway provides

### 8B: Update DNS Records

**In your domain provider (GoDaddy, Namecheap, etc.):**

1. Go to DNS settings
2. Add CNAME record:
   - **Name:** `app` (or your subdomain)
   - **Value:** [The CNAME from Railway]
   - **TTL:** 3600 (or default)
3. Save changes

**Wait for DNS to propagate** (5-15 minutes)

### 8C: Update Environment Variable

**In Railway Dashboard → Frontend Service → Variables:**

Update:
```
VITE_API_URL = https://api.yourdomain.com
```

**Or if backend also has domain:**

Add domain to Backend service too, then use:
```
VITE_API_URL = https://api.yourdomain.com
```

---

## 💾 STEP 9: Setup File Storage

### Option A: Railway Volumes (Recommended - Simple)

**In Railway Dashboard → Backend Service:**

1. Click "Volumes"
2. Click "+ Add Volume"
3. Configuration:
   - **Mount Path:** `/app/uploads`
   - **Size:** 10GB (adjust as needed)
4. Save

✅ PDFs and signatures persist across deployments!

---

### Option B: AWS S3 (Advanced - Scalable)

*Skip this if you chose Option A*

**If you need to scale to multiple backend instances:**

1. Create AWS account and S3 bucket
2. Create IAM user with S3 access
3. Get Access Key ID and Secret Access Key
4. Add to Backend environment variables:

```
AWS_ACCESS_KEY_ID = [Your key]
AWS_SECRET_ACCESS_KEY = [Your secret]
AWS_REGION = us-east-1
S3_BUCKET = servicemonks-pdfs
```

5. Requires code modification to use S3 client (more advanced)

---

## ✅ STEP 10: Verify Deployment

### 10A: Check Health Endpoint

```bash
# Test with curl (or browser)
curl https://api.yourdomain.com/health
# Or if using Railway domain:
curl https://backend-service-url.railway.app/health

# Expected response:
# {"status":"ok","database":"ok","environment":"production"}
```

### 10B: Test Login

**In your browser:**
1. Go to https://app.yourdomain.com (or Railway frontend URL)
2. Login with:
   - Employee ID: `ADMIN`
   - Password: `admin123`
3. Should see dashboard

### 10C: Change Admin Password

**After successful login:**
1. Go to Users page
2. Edit ADMIN user
3. Change password to secure value
4. **IMPORTANT: Do this immediately!**

---

## 📊 STEP 11: Verify Core Features

### Test Job Submission Workflow

1. **Create a customer** (Manager tab)
2. **Create a job** and assign to technician
3. **Login as technician** (create test account if needed)
4. **Check in to job** - verify location tracking
5. **Submit job with signature**
   - Upload a test signature (PNG base64)
   - Add remarks
6. **Verify PDF generated** - check `/uploads/pdfs` in backend logs
7. **Verify email sent** - check logs (may be blocked by ISP, check spam)
8. **Verify job status = COMPLETED**

---

## 🔍 STEP 12: Monitor Logs

### View Real-Time Logs

**In Railway Dashboard:**

1. **Backend Service:**
   - Click service
   - Click "Logs" tab
   - Watch real-time logs
   - Look for: `✓ Database connection verified`, `INFO` log entries

2. **Frontend Service:**
   - Click service
   - Click "Logs" tab
   - Should see build logs and nginx startup

3. **PostgreSQL Service:**
   - Click service
   - View database logs for any connection issues

### Common Logs to Look For

```
✓ Database connection verified
✓ Database schema initialized
✓ Seed data initialized
Successful login: ADMIN
Job 1 marked as COMPLETED
PDF generated successfully
Completion email sent
```

---

## 🚨 STEP 13: Troubleshooting

### Issue: Backend not starting

**Check logs:**
```
- Look for DATABASE_URL error
- Check SECRET_KEY validation error
- Verify all environment variables are set
```

**Solution:**
1. Verify DATABASE_URL is correct (use Railway's connection string)
2. Verify SECRET_KEY is long random string (min 32 chars)
3. Check SMTP_PASSWORD is set
4. Restart backend service

### Issue: Frontend not connecting to backend

**Problem:** CORS errors in browser console

**Solution:**
1. Verify `VITE_API_URL` matches backend domain
2. Verify `ALLOWED_ORIGINS` in backend includes frontend domain
3. Check browser console for specific CORS error
4. Restart frontend service

### Issue: Health check returns 503

**Problem:** Database disconnected

**Solution:**
1. Check PostgreSQL service is running
2. Verify DATABASE_URL is correct
3. Check database connection in backend logs
4. Restart backend service

### Issue: PDF generation failing

**Problem:** Upload directory issue

**Solution:**
1. Verify volume is mounted at `/app/uploads`
2. Check logs for permission errors
3. Restart backend service

### Issue: Email not sending

**Problem:** SMTP credentials incorrect

**Solution:**
1. Test SMTP credentials with tool like: https://www.gmass.co/smtp
2. Verify SMTP_USER and SMTP_PASSWORD
3. Check spam folder
4. Look in logs for SMTP error details

---

## 📈 STEP 14: Setup Monitoring & Backups

### Enable Notifications

**In Railway Dashboard:**
1. Go to Project Settings
2. Click "Integrations" or "Alerts"
3. Setup Slack/Email notifications for:
   - Deployment failures
   - High CPU/Memory usage
   - Service crashes

### Database Backups

**Railway automatically backs up PostgreSQL:**
1. Go to PostgreSQL service
2. Click "Backups" tab
3. View backup schedule
4. Manual backups available

**To restore from backup:**
1. Contact Railway support or use dashboard restore option
2. Keep backup credentials safe

---

## 🎉 DEPLOYMENT COMPLETE!

You now have:
- ✅ Git repository with all code
- ✅ Production-ready application on Railway
- ✅ PostgreSQL database
- ✅ Frontend and backend services
- ✅ Custom domain (optional)
- ✅ File storage for PDFs
- ✅ Environment variables configured
- ✅ Logging and monitoring

---

## 📞 NEXT STEPS

1. **Monitor your deployment:**
   - Check logs regularly
   - Watch for errors
   - Test features thoroughly

2. **Setup additional features:**
   - Configure email delivery verification
   - Setup monitoring alerts
   - Configure backups

3. **Team access:**
   - Add team members to Railway project
   - Setup CI/CD for automatic deployments
   - Document environment setup for team

4. **Ongoing maintenance:**
   - Update dependencies regularly
   - Review logs for issues
   - Monitor performance
   - Plan for scaling

---

## 🔐 Security Reminders

- ✅ Never commit `.env` files (use `.gitignore`)
- ✅ Rotate SECRET_KEY periodically
- ✅ Use strong passwords for all accounts
- ✅ Restrict API keys to specific domains
- ✅ Monitor logs for suspicious activity
- ✅ Keep dependencies updated
- ✅ Regular security audits

---

## 📚 References

- Railway Documentation: https://docs.railway.app
- FastAPI Documentation: https://fastapi.tiangolo.com
- React Documentation: https://react.dev
- PostgreSQL Documentation: https://www.postgresql.org/docs

---

**Deployment Guide Created:** June 15, 2026  
**Status:** Ready for Production ✅  
**Questions?** Check RAILWAY_DEPLOYMENT_GUIDE.md for more details

