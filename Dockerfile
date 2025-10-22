# Use nginx alpine for a lightweight image
FROM nginx:alpine

# Copy all static files to nginx html directory
COPY . /usr/share/nginx/html

# Copy custom nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
