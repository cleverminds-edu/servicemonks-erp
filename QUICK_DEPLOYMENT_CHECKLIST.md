# 🚀 Quick Deployment Checklist
**Your ServiceMonks ERP is ready to deploy!**

---

## ✅ BEFORE YOU START

### Gather These Items (5 minutes)

- [ ] **SECRET_KEY** - Generate with: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
  - Looks like: `jR8k9vL_c2xQmP5nF7yZ_hJ3qW6mT4zX9_aB0dC5eF`

- [ ] **SMTP Credentials** (Gmail or SendGrid)
  - Gmail: 16-char app password from https://myaccount.google.com/apppasswords
  - Looks like: `abcd efgh ijkl mnop`

- [ ] **Google Maps API Key**
  - From: https://console.cloud.google.com/
  - Restrict to your domain in Google Cloud Console

- [ ] **GitHub Account**
  - Create at https://github.com if needed

- [ ] **Railway Account**
  - Sign up at https://railway.app

- [ ] **Custom Domain** (Optional)
  - Can use Railway's auto-generated domain
  - Or your own domain: `app.yourdomain.com`

---

## 🔄 DEPLOYMENT STEPS (30 minutes)

### Step 1: Push Code to GitHub (2 min)

```bash
# In your project directory:
git remote add origin https://github.com/YOUR-USERNAME/servicemonks-erp.git
git push -u origin main
```

✅ **Verify:** Go to https://github.com/YOUR-USERNAME/servicemonks-erp and see your code

---

### Step 2: Create Railway Project (1 min)

1. Go to https://railway.app
2. Login/Sign up
3. Click "New Project"
4. Select "GitHub Repo"
5. Choose your repository
6. Click "Deploy"

---

### Step 3: Add PostgreSQL (2 min)

**In Railway Dashboard:**
1. Click "+ New"
2. Search "PostgreSQL"
3. Click "Deploy"
4. Wait for initialization (database created, `DATABASE_URL` generated)

---

### Step 4: Add Backend Service (3 min)

**In Railway Dashboard:**
1. Click "+ New"
2. Select "GitHub Repo"
3. Choose your repo
4. **Root Directory:** `backend`
5. Confirm and deploy

---

### Step 5: Add Frontend Service (3 min)

**In Railway Dashboard:**
1. Click "+ New"
2. Select "GitHub Repo"
3. Choose your repo
4. **Root Directory:** `frontend`
5. Confirm and deploy

---

### Step 6: Set Environment Variables (15 min)

**Backend Service Variables:**

```
ENVIRONMENT = production
DATABASE_URL = [Copy from PostgreSQL service]
SECRET_KEY = [Your generated key]
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
ALLOWED_ORIGINS = https://YOUR-DOMAIN.com
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = [Your app password]
SMTP_FROM_NAME = Service Monks
NOTIFICATION_EMAIL = team@yourdomain.com
RATE_PER_KM = 5.0
MAX_SIGNATURE_SIZE_KB = 500
```

**Frontend Service Variables:**

```
VITE_GOOGLE_MAPS_KEY = [Your API key]
VITE_API_URL = http://backend.railway.internal:8000
```

Or if using custom domain:
```
VITE_API_URL = https://api.yourdomain.com
```

---

### Step 7: Add Storage Volume (2 min)

**For Backend Service:**
1. Click "Volumes"
2. Click "+ New"
3. **Mount Path:** `/app/uploads`
4. **Size:** 10GB
5. Save

---

## 🧪 AFTER DEPLOYMENT (10 minutes)

### Test Health Endpoint

```bash
# Replace with your backend URL
curl https://YOUR-BACKEND-URL/health

# Should return:
# {"status":"ok","database":"ok","environment":"production"}
```

### Test Login

1. Go to your frontend URL
2. Login: `ADMIN` / `admin123`
3. **IMMEDIATELY change the admin password!**

### Test Job Workflow

1. Create a customer (Manager)
2. Create a job
3. Assign to technician
4. Login as technician
5. Check-in to job
6. Submit job with test signature
7. Verify PDF generated
8. Verify email sent (check spam folder)

---

## 📝 WHAT YOU HAVE NOW

```
✅ Git repository with all code
✅ Production application on Railway
✅ PostgreSQL database (auto-backed up)
✅ Frontend (React with Nginx)
✅ Backend (FastAPI with security hardening)
✅ File storage for PDFs and signatures
✅ Environment variables configured
✅ Logging enabled
✅ Health monitoring ready
✅ HTTPS automatic (Railway)
```

---

## 🚨 IMPORTANT REMINDERS

- ✅ **NEVER commit .env files** - already in .gitignore
- ✅ **Change admin password immediately** after first login
- ✅ **Save your secrets securely** - SECRET_KEY, SMTP_PASSWORD
- ✅ **Check logs regularly** for errors and issues
- ✅ **Monitor email delivery** - may be blocked by ISP initially
- ✅ **Rotate credentials periodically** for security

---

## 🆘 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| **Backend won't start** | Check DATABASE_URL and SECRET_KEY in env vars |
| **Frontend can't reach backend** | Verify VITE_API_URL and ALLOWED_ORIGINS |
| **Login not working** | Check logs, verify SMTP setup, ensure database connected |
| **PDF not generating** | Check volume is mounted, verify disk space |
| **Email not sending** | Check SMTP credentials, verify app password, check spam |
| **Health check returns 503** | Restart backend service, check database connection |

---

## 📞 NEED HELP?

- **Deployment issues:** See `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Testing:** See `DETAILED_TEST_CASES.md`
- **Security:** See `SECURITY_HARDENING_SUMMARY.md`
- **All questions:** See `QA_TESTING_INDEX.md` for complete documentation map

---

## ⏱️ TOTAL TIME ESTIMATE

- **Setup (gather credentials):** 5 minutes
- **Deployment:** 30 minutes
- **Testing & verification:** 10 minutes
- **Total:** ~45 minutes to production ✅

---

## 🎉 YOU'RE LIVE!

Your ServiceMonks ERP is now running in production with:
- 🔒 Complete security hardening
- 📊 Rate limiting and input validation
- 📝 Comprehensive logging
- ⚡ Error handling and graceful degradation
- 🗄️ PostgreSQL database with backups
- 💾 File storage for PDFs
- 🌐 HTTPS enabled
- 📈 Monitoring ready

**Next step:** Monitor logs and user feedback for improvements!

---

**Quick Checklist Created:** June 15, 2026  
**Status:** Ready to Deploy ✅

