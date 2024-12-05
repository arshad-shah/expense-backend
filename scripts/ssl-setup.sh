# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d expense-api.arshadshah.com

apt install -y htop


# Configure firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# Create a non-root user
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

Appsare100%nice


# Open crontab
crontab -e

# Add these lines
0 0 * * * docker system prune -f
0 0 * * 0 certbot renew