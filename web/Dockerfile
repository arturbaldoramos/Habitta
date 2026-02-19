# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application for production
RUN npm run build -- --configuration production

# Stage 2: Runtime (Nginx)
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist/web/browser /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1000 habitta && \
    adduser -D -u 1000 -G habitta habitta && \
    chown -R habitta:habitta /usr/share/nginx/html && \
    chown -R habitta:habitta /var/cache/nginx && \
    chown -R habitta:habitta /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R habitta:habitta /var/run/nginx.pid

# Switch to non-root user
USER habitta

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
