# Use a modern Node base image
FROM node:21-alpine AS builder

# Upgrade to npm 10.9.2
RUN npm install -g npm@10.9.2

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy source files
COPY . .

# Build the React app
RUN npm run build

# Use NGINX to serve static files
FROM nginx:alpine

# Copy custom NGINX config template
COPY nginx.conf /etc/nginx/conf.d/configfile.template

# Set working directory to nginx's static asset folder
WORKDIR /usr/share/nginx/html

# Remove default assets
RUN rm -rf *

# Copy built React app from builder stage
COPY --from=builder /app/build .

# Define env vars for Cloud Run
ENV PORT 8080
ENV HOST 0.0.0.0
EXPOSE 8080

# Run nginx with environment-substituted config
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/configfile.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"