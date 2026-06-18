# ServiceMonks ERP - Railway Deployment Guide

## Overview
The application consists of two services on Railway:
- **Frontend**: React + Vite + Nginx (serves static files and proxies API calls)
- **Backend**: FastAPI + PostgreSQL (REST API)

## Backend Service Configuration

### Environment Variables (Required)
These must be set in Railway's environment variables for the backend service:

```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/servicemonks
ENVIRONMENT=production
SECRET_KEY=<long-random-string-min-32-chars>
ALLOWED_ORIGINS=https://your-frontend-domain.railway.app
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=noreply@servicemonks.com
SMTP_PASSWORD=<your-smtp-password>
```

### Critical Setup Steps

1. **Create PostgreSQL Database**
   - Railway > Create Service > PostgreSQL
   - Link it to the backend service
   - Railway will automatically set `DATABASE_URL`

2. **Verify Database Connection**
   - After deployment, check: `GET /api/health`
   - Should return: `{"status": "ok", "database": "ok"}`
   
   If database is not ok, check:
   - `GET /api/v1/diagnostic` for detailed error messages
   - PostgreSQL service is running and linked
   - DATABASE_URL is correctly set

3. **Initialize Database Schema**
   - The startup event in `main.py` automatically creates all tables
   - If tables don't exist after first deployment, check Railway logs
   - No manual migration or setup required

4. **Set Secret Key**
   - Generate a secure key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - Set this as `SECRET_KEY` environment variable
   - Do NOT use the default value in `.env`

## Frontend Service Configuration

### Environment Variables (Required)
These must be set in Railway's environment variables for the frontend service:

```
BACKEND_URL=https://your-backend-service.railway.app
VITE_GOOGLE_MAPS_KEY=<your-google-maps-api-key>
```

### Critical Setup Steps

1. **Link Backend Service**
   - The `docker-entrypoint.sh` script will substitute `BACKEND_URL` at runtime
   - Frontend will proxy all `/api/*` requests to `$BACKEND_URL/api/*`

2. **Build Configuration**
   - Ensure `VITE_GOOGLE_MAPS_KEY` is set before building
   - Vite will embed this during build time

3. **Access the App**
   - Frontend should be accessible at your Railway frontend URL
   - Verify in browser DevTools that API calls are going to the correct backend

## Troubleshooting

### "All endpoints return 500"

1. **Check Backend Health**
   ```bash
   curl https://your-backend.railway.app/api/health
   ```
   - If this returns an error, backend has a connectivity issue

2. **Check Diagnostic Info**
   ```bash
   curl https://your-backend.railway.app/api/v1/diagnostic
   ```
   - Shows which tables exist and which queries work
   - Identifies if database connection is the issue

3. **Check Railway Logs**
   - Backend service > Deployment > Logs
   - Look for startup errors or database connection failures

4. **Verify Database Connection**
   - Check that PostgreSQL service is running
   - Verify DATABASE_URL is set in backend environment variables
   - Ensure the database user has proper permissions

### "Frontend can't connect to backend"

1. **Verify BACKEND_URL is set**
   - Frontend service > Variables
   - Should be your backend service's public Railway URL
   - Example: `https://backend-service.railway.app`

2. **Check CORS Configuration**
   - Backend must allow your frontend origin
   - Set `ALLOWED_ORIGINS` to your frontend's Railway URL

3. **Test connectivity from frontend logs**
   - Frontend service > Deployment > Logs
   - Look for proxy errors when making API calls

### "Password change modal loops forever"

1. **Ensure `password_changed` column exists**
   - Check: `GET /api/v1/diagnostic` shows users table exists
   - Database schema automatically created, but verify via diagnostic

2. **Check seed user was created**
   - Login with: SM000 / Anupally@123
   - If login fails, check backend logs for seed error

### "Can't login as SM000"

1. **Verify superuser exists**
   - Backend logs during startup should show "Created superuser: SM000"
   - Check: `GET /api/v1/diagnostic` or backend logs

2. **Verify password hash is correct**
   - Default password: `Anupally@123`
   - Change password immediately after first login

3. **Ensure is_active=true**
   - Database may have soft-deleted the user

## Deployment Workflow

### Initial Deployment

1. Fork/clone the repository
2. Create Railway project
3. Add Backend Service:
   - Source: GitHub repo, branch `main`
   - Root directory: `backend`
   - Build command: (default)
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Add PostgreSQL service and link to backend
5. Set backend environment variables (see above)
6. Add Frontend Service:
   - Source: GitHub repo, branch `main`
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Start command: (default, uses Dockerfile)
7. Set frontend environment variables
   - BACKEND_URL = backend service Railway URL
   - VITE_GOOGLE_MAPS_KEY = your API key
8. Deploy both services
9. Test endpoints as described in Troubleshooting section

### After Changes

```bash
# Make changes to code
git add .
git commit -m "Your changes"
git push origin main

# Railway auto-deploys from main branch
# Monitor: Railway Dashboard > Deployments
```

## Important Notes

### No Manual Database Setup Needed
- Tables are created automatically on app startup
- Users, customers, services, jobs tables are all auto-created
- No migrations or SQL scripts to run

### Default Credentials
- Super Admin: SM000 / Anupally@123
- Change password immediately after first login
- All employees created by admin will have phone as default password

### File Storage
- Signatures and PDFs are stored in `uploads/` directory
- On Railway, these are ephemeral (lost on redeploy)
- For production, configure S3 or persistent volume

### Rate Limiting
- API has built-in rate limiting via slowapi
- Configured per-IP to prevent abuse
- Can be adjusted in config if needed

## Monitoring

### Health Endpoints
- `/api/health` - Quick health check
- `/api/v1/diagnostic` - Detailed system status

### Application Logs
- Backend: Railway > Deployment > Logs
- Frontend: Browser console (F12 > Console tab)
- Check for validation errors or API call failures

### Database Monitoring
- Railway > PostgreSQL > Metrics
- Monitor connections, query performance

## Support

If you encounter issues:

1. **Check diagnostic endpoint**: `GET /api/v1/diagnostic`
2. **Check Railway logs** for both services
3. **Verify environment variables** are set correctly
4. **Review AUDIT_RESULTS.md** for root cause analysis methodology
