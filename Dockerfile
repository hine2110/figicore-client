# Stage 1: Build the application
FROM node:22-alpine as builder

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies, prioritizing yarn if yarn.lock exists
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm install --immutable; fi

COPY . .

# Build the Vite application for production
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint to generate config.js from env at container start
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy a custom Nginx configuration (optional, but recommended for production)
# If you have a custom nginx.conf, uncomment the line below and place it in your project root.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Nginx
EXPOSE 80

# Generate config.js from env vars, then start Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]