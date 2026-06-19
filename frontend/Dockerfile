FROM node:20-alpine AS builder
WORKDIR /app
# Cache bust to force fresh build
RUN echo "2026-06-19-1420-final-nginx-hardcoded-host-fix"
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GOOGLE_MAPS_KEY
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
