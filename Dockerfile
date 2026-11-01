FROM nginx:alpine

# Remove default static nginx contents
RUN rm -rf /usr/share/nginx/html/*

# Copy local web files into nginx public root
COPY . /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]