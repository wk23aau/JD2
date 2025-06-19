# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if you use Yarn)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire src directory from your local machine to /app/src in the image
COPY src ./src

# Copy other necessary configuration files from your local root to /app in the image
COPY vite.config.ts .
COPY tsconfig.json .
COPY index.html .
# COPY tailwind.config.js . # If you have a separate tailwind.config.js, ensure it's copied
# COPY postcss.config.js .  # If you have a separate postcss.config.js, ensure it's copied

# If you have a 'public' directory at your project root for static assets, copy it too.
# Example: COPY public ./public

# Ensure VITE_GEMINI_API_KEY is available as an environment variable during the build
ARG GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY

# List files in /app and /app/src to debug (This helps confirm the copy operations)
RUN echo "--- Listing /app (build stage root) ---" && ls -la /app
RUN echo "--- Listing /app/src (build stage src) ---" && ls -la /app/src

# Build the application
RUN npm run build
# The build output will be in /app/dist

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the build output from the 'build' stage (/app/dist) into Nginx's web server directory
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: If you have a custom Nginx configuration file (e.g., for SPA routing)
# Create a file named nginx.conf in your project root with content like:
# server {
#   listen 80;
#   server_name localhost; # Or your domain
#
#   location / {
#     root   /usr/share/nginx/html;
#     index  index.html;
#     try_files $uri $uri/ /index.html; # Essential for SPAs
#   }
#
#   # Optional: You can add more configurations, like caching, gzip, etc.
#   # location ~* \.(?:jpg|jpeg|gif|png|ico|css|js)$ {
#   #   expires 7d;
#   #   add_header Cache-Control "public";
#   # }
# }
# Then uncomment the next line to copy it:
COPY nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
