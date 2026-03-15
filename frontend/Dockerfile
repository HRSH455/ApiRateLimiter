# Frontend Dockerfile (multi-stage)
# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Copy custom nginx config (proxy API calls to backend)
COPY nginx.conf /etc/nginx/nginx.conf

# Remove default static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app
COPY --from=build /app/dist/api-rate-limiter/browser /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
