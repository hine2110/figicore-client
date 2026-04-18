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

# Copy custom Nginx configuration for SPA routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]