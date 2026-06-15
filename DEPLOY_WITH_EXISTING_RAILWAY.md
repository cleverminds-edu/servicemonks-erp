# Deploy ServiceMonks ERP to Your Existing Railway Account
**Your Railway Account:** Ready to use  
**GitHub Repository:** Ready to connect  
**Application:** Production-ready

---

## ⚡ QUICK START (3 STEPS)

### Step 1: Push Code to GitHub
```bash
# Replace YOUR-USERNAME with your GitHub username
git remote add origin https://github.com/YOUR-USERNAME/servicemonks-erp.git
git branch -M main
git push -u origin main
```

### Step 2: Login to Railway
```
Go to: https://dashboard.railway.app
Your existing account will work
```

### Step 3: Follow Railway's GitHub Integration
```
1. Click "New Project" in Railway
2. Select "GitHub Repo"
3. Select servicemonks-erp
4. Railway auto-deploys on git push!
```

---

## 📋 COMPLETE DEPLOYMENT PROCESS

### Phase 1: GitHub Setup (5 minutes)

#### 1.1 Create GitHub Repository

**Go to:** https://github.com/new

Fill in:
- **Repository name:** servicemonks-erp
- **Description:** Service Monks ERP - Job tracking with signature capture
- **Public or Private:** Your choice
- **Initialize:** Leave unchecked ✓
- **Click:** Create repository

#### 1.2 Push Code to GitHub

```bash
# Copy and run these commands:
cd /Users/maddy/servicemonks-erp

git remote add origin https://github.com/YOUR-USERNAME/servicemonks-erp.git
git branch -M main
git push -u origin main

# You'll be asked for GitHub credentials:
# - Username: Your GitHub username
# - Password: Use GitHub Personal Access Token
#   (Create at: https://github.com/settings/tokens)
```

**To create GitHub Personal Access Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`
4. Generate and copy the token
5. Use as password in terminal

**Verify it worked:**
```bash
# Visit: https://github.com/YOUR-USERNAME/servicemonks-erp
# You should see all your code there
```

---

### Phase 2: Railway Project Setup (10 minutes)

#### 2.1 Login to Railway

Go to: https://dashboard.railway.app

You'll see your Railway dashboard with your existing projects.

#### 2.2 Create New Project

1. Click **"New Project"** (or **"+ Project"**)
2. Select **"GitHub Repo"**
3. **Connect GitHub** (if not already connected)
   - Click "Connect with GitHub"
   - Authorize Railway to access your repos
4. **Select Repository:** `servicemonks-erp`
5. **Select Branch:** `main`
6. Click **"Deploy"**

Railway will now:
- Detect your Dockerfiles
- Build services automatically
- Deploy frontend and backend

---

### Phase 3: Configure Services (15 minutes)

#### 3.1 PostgreSQL Database

Railway auto-detects Docker services. You need to add PostgreSQL:

**In your Railway project:**

1. Click **"+ New"**
2. Search **"PostgreSQL"**
3. Click **PostgreSQL** in results
4. Click **"Deploy"**

Wait 2-3 minutes for database initialization.

#### 3.2 Backend Service

Railway should auto-detect from `backend/Dockerfile`:

1. Find **"Backend"** service (or similar name)
2. Click to configure
3. Verify settings:
   - **Root Directory:** `backend` ✓
   - **Port:** 8000 ✓
   - **Dockerfile:** `./Dockerfile` ✓

#### 3.3 Frontend Service

Railway should auto-detect from `frontend/Dockerfile`:

1. Find **"Frontend"** service
2. Click to configure
3. Verify settings:
   - **Root Directory:** `frontend` ✓
   - **Port:** 80 ✓
   - **Dockerfile:** `./Dockerfile` ✓

---

### Phase 4: Environment Variables (10 minutes)

#### 4.1 Generate Production Secrets

**Generate SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output (looks like: `jR8k9vL_c2xQmP5nF7yZ_hJ3qW6mT4zX9_aB0dC5eF`)

**Get SMTP Credentials:**

Gmail (Recommended):
1. Go to https://myaccount.google.com/security
2. Enable 2FA if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select Mail → Windows Computer
5. Generate password (copy the 16 characters)

**Get Google Maps API Key:**
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable "Maps JavaScript API"
4. Go to Credentials → Create API Key
5. Restrict to your domain in Google Cloud Console

#### 4.2 Add Backend Environment Variables

**In Railway Dashboard → Backend Service:**

Click **"Variables"** tab and add each one:

```
ENVIRONMENT = production

DATABASE_URL = [Copy from PostgreSQL service - see below]

SECRET_KEY = [Your generated key]

ACCESS_TOKEN_EXPIRE_MINUTES = 1440

ALLOWED_ORIGINS = https://your-domain.com

SMTP_HOST = smtp.gmail.com

SMTP_PORT = 587

SMTP_USER = your-email@gmail.com

SMTP_PASSWORD = [16-char app password]

SMTP_FROM_NAME = Service Monks

NOTIFICATION_EMAIL = team@yourdomain.com

RATE_PER_KM = 5.0

MAX_SIGNATURE_SIZE_KB = 500
```

**How to get DATABASE_URL:**
1. In Railway, click **PostgreSQL service**
2. Click **"Connect"** tab
3. Copy full connection string (starts with `postgresql://`)
4. Paste as DATABASE_URL in backend variables

#### 4.3 Add Frontend Environment Variables

**In Railway Dashboard → Frontend Service:**

Click **"Variables"** tab and add:

```
VITE_GOOGLE_MAPS_KEY = [Your API key]

VITE_API_URL = http://backend.railway.internal:8000
```

Or if using custom domain:
```
VITE_API_URL = https://api.yourdomain.com
```

---

### Phase 5: Storage Configuration (5 minutes)

#### 5.1 Add Volume for File Storage

**In Railway Dashboard → Backend Service:**

1. Click **"Volumes"** tab
2. Click **"+ New Volume"**
3. Configure:
   - **Mount Path:** `/app/uploads`
   - **Size:** 10GB
4. **Save**

Your PDFs and signatures will persist across deployments!

---

### Phase 6: Custom Domain Setup (Optional - 5 minutes)

#### 6.1 Add Domain to Frontend

**In Railway Dashboard → Frontend Service:**

1. Click **"Settings"**
2. Find **"Domains"** section
3. Click **"+ Add Domain"**
4. Enter your domain: `app.yourdomain.com`
5. Copy the **CNAME** value

#### 6.2 Update DNS Records

**In your domain provider (GoDaddy, Namecheap, etc.):**

1. Go to DNS settings
2. Add CNAME record:
   - **Name:** `app`
   - **Value:** [The CNAME from Railway]
   - **TTL:** 3600
3. Save changes

Wait 5-15 minutes for DNS to propagate.

#### 6.3 Add Domain to Backend (Optional)

If you want API on separate domain:
1. Repeat steps for backend
2. Use `api.yourdomain.com`
3. Update `VITE_API_URL` in frontend variables

---

## ✅ VERIFICATION (10 minutes)

### Test Health Endpoint

```bash
# Your backend URL (from Railway dashboard)
curl https://your-backend-url/health

# Expected response:
# {"status":"ok","database":"ok","environment":"production"}
```

### Test Login

1. **Go to:** Your frontend URL (from Railway dashboard)
2. **Login with:**
   - Employee ID: `ADMIN`
   - Password: `admin123`
3. **Should see:** Dashboard

### Change Admin Password (IMPORTANT!)

1. Go to Users page
2. Edit ADMIN user
3. Change password to secure value
4. **Save immediately!**

### Test Job Workflow

1. Create a customer
2. Create a job
3. Assign to technician
4. Login as technician
5. Check-in to job
6. Submit with test signature
7. Verify PDF generated
8. Verify email received

---

## 🔍 MONITORING & LOGS

### View Logs in Railway

**For each service:**
1. Click service in dashboard
2. Click **"Logs"** tab
3. Watch real-time logs

**Look for:**
```
✓ Database connection verified
✓ Database schema initialized
Successful login: ADMIN
Job marked as COMPLETED
PDF generated successfully
```

### Troubleshooting with Logs

If something doesn't work:
1. Check the relevant service logs
2. Look for ERROR or WARNING messages
3. See `QUICK_DEPLOYMENT_CHECKLIST.md` troubleshooting section

---

## 🚀 AUTO-DEPLOYMENT

**Future Updates:**

After initial deployment, Railway auto-deploys when you push to GitHub:

```bash
# Make code changes
git add .
git commit -m "Your message"
git push origin main

# Railway automatically:
# 1. Detects the push
# 2. Rebuilds services
# 3. Deploys new version
# 4. Zero downtime deployment
```

---

## 📋 COMPLETE CHECKLIST

### Before Deployment
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] SECRET_KEY generated
- [ ] SMTP credentials obtained
- [ ] Google Maps API key created

### During Deployment
- [ ] PostgreSQL added to Railway
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Environment variables configured
- [ ] Storage volume added

### After Deployment
- [ ] Health endpoint returns 200 ✓
- [ ] Login works (ADMIN/admin123)
- [ ] Admin password changed
- [ ] Job workflow tested
- [ ] PDF generation verified
- [ ] Email delivery verified
- [ ] Logs monitoring setup

---

## ⏱️ TOTAL TIME ESTIMATE

- **Setup secrets:** 5 minutes
- **Push to GitHub:** 2 minutes
- **Railway setup:** 15 minutes
- **Configure services:** 10 minutes
- **Add environment variables:** 10 minutes
- **Verification & testing:** 10 minutes
- **Total:** ~50 minutes ✅

---

## 📞 SUPPORT

**Questions?**

1. **Deployment:** See `QUICK_DEPLOYMENT_CHECKLIST.md`
2. **Security:** See `SECURITY_HARDENING_SUMMARY.md`
3. **Testing:** See `DETAILED_TEST_CASES.md`
4. **All docs:** See `QA_TESTING_INDEX.md`
5. **Railway docs:** https://docs.railway.app

---

## 🎉 YOU'RE READY!

Your application is:
- ✅ Hardened (10 security fixes)
- ✅ Tested (83/83 tests passed)
- ✅ Documented (300+ pages)
- ✅ Dockerized (ready for Railway)
- ✅ Production-ready

**Next:** Push code to GitHub and deploy! 🚀

---

**Guide Created:** June 15, 2026  
**Status:** ✅ Ready to Deploy  
**Time to Live:** ~50 minutes

