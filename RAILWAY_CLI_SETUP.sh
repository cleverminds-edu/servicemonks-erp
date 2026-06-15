#!/bin/bash

# Install Railway CLI (if needed)
# npm install -g @railway/cli

# Login to Railway
# railway login

# Create project
# railway init

# Add services with root directory
# railway service add --name backend --root-dir backend
# railway service add --name frontend --root-dir frontend

# Or if services already exist, configure them:
echo "Instructions:"
echo "1. Go to: https://dashboard.railway.app"
echo "2. Delete failed services"
echo "3. Click: + New → GitHub Repo"
echo "4. Select: servicemonks-erp"
echo "5. Set Root Directory: backend (for backend service)"
echo "6. Repeat for frontend with Root Directory: frontend"
echo ""
echo "That's it! Railway will use Dockerfiles automatically."
