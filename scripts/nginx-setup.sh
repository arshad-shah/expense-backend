# Install Nginx
apt install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/expense-tracker << EOL
server {
    listen 80;
    server_name your_domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site
ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t
systemctl reload nginx