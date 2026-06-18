#!/bin/sh
set -e

# Substitute environment variables in nginx.conf
# This allows the BACKEND_URL to be set at runtime via Railway environment variables

# Default BACKEND_URL if not provided
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"

# Create the nginx config with substituted values
envsubst '$BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
