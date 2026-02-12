# Production Deployment Guide - Kafka Tic-Tac-Toe

## Overview

This guide covers deploying the Kafka Tic-Tac-Toe application with either **Nginx** or **Apache** as the web server. The architecture consists of:

- **Frontend**: React app (Vite) - static files served via Nginx/Apache
- **Backend**: Node.js/Express with Socket.io - running on port 3001
- **Kafka**: Message broker (Docker) - port 9092
- **Web Server**: Nginx or Apache - reverse proxy and static file serving

## Architecture

```
User Browser (HTTPS)
    ↓
Nginx/Apache (Port 443)
    ├─→ Static Files (React Frontend)
    ├─→ /api/* → Backend (Port 3001)
    └─→ /socket.io → Backend WebSocket (Port 3001)
         ↓
    Node.js Backend
         ↓
    Kafka Broker (Port 9092)
```

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- **Node.js 18+ and npm** (⚠️ Ubuntu 12 default has Node.js 12 - requires update)
- Docker and docker-compose (for Kafka)
- SSL certificate (Let's Encrypt recommended)
- Domain name pointing to server

## Deployment Step-by-Step

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Check current Node.js version
node -v

# If Node.js is NOT installed or version is < 18:
# Install or upgrade to Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v18.x.x or higher
npm -v   # Should show 8.x.x or higher

# Install PM2 globally (process manager)
sudo npm install -g pm2

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Clone and Build Application

```bash
# Navigate to deployment directory
cd /var/www
sudo git clone <your-repo-url> kafka-tictactoe
cd kafka-tictactoe

# Install dependencies
npm install

# Build for production
npm run build:prod
```

### Step 3: Setup Frontend (Static Files)

```bash
# Prepare directory for static files
sudo mkdir -p /var/www/html
sudo chown -R $USER:$USER /var/www/html

# Deploy frontend
cp -r frontend/dist/* /var/www/html/
```

### Step 4: Choose Your Web Server

#### Option A: Nginx Deployment

```bash
# Install Nginx
sudo apt install -y nginx

# Copy configuration
sudo cp nginx.conf.example /etc/nginx/sites-available/tictactoe

# Edit configuration with your domain
sudo nano /etc/nginx/sites-available/tictactoe
# Replace 'yourdomain.com' with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/tictactoe /etc/nginx/sites-enabled/

# Disable default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Reload after changes
sudo systemctl reload nginx
```

#### Option B: Apache Deployment

```bash
# Install Apache
sudo apt install -y apache2

# Enable required modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers

# Copy configuration
sudo cp apache.conf.example /etc/apache2/sites-available/tictactoe.conf

# Edit configuration with your domain
sudo nano /etc/apache2/sites-available/tictactoe.conf
# Replace 'yourdomain.com' with your actual domain

# Enable site
sudo a2ensite tictactoe

# Disable default site
sudo a2dissite 000-default

# Test configuration
sudo apache2ctl configtest

# Start Apache
sudo systemctl start apache2
sudo systemctl enable apache2

# Reload after changes
sudo systemctl reload apache2
```

### Step 5: Setup Backend Service

#### Option A: Using PM2 (Recommended)

```bash
# Copy PM2 config
cp ecosystem.config.example.cjs ecosystem.config.cjs

# Edit with your settings
nano ecosystem.config.cjs

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Save startup configuration
pm2 startup
pm2 save

# View logs
pm2 logs tictactoe-backend

# Monitor
pm2 monit
```

#### Option B: Using systemd Service

```bash
# Copy service file
sudo cp tictactoe-backend.service.example /etc/systemd/system/tictactoe-backend.service

# Edit with your settings
sudo nano /etc/systemd/system/tictactoe-backend.service

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable tictactoe-backend
sudo systemctl start tictactoe-backend

# Check status
sudo systemctl status tictactoe-backend

# View logs
sudo journalctl -u tictactoe-backend -f
```

### Step 6: Setup Kafka (Optional - for message broker functionality)

```bash
# From project root with docker-compose.yml
docker-compose up -d

# Verify running
docker-compose ps

# View logs
docker-compose logs -f kafka

# Stop (if needed)
docker-compose down
```

### Step 7: Setup HTTPS with Let's Encrypt

#### For Nginx:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
sudo systemctl enable certbot.timer
```

#### For Apache:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Step 8: Environment Variables

Create `.env` file or export in startup scripts:

```bash
NODE_ENV=production
PORT=3001
KAFKA_BROKER=localhost:9092
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## Verification

### Check if services are running:

```bash
# Check Nginx/Apache
sudo systemctl status nginx  # or apache2

# Check backend (PM2)
pm2 status

# Check backend (systemd)
sudo systemctl status tictactoe-backend

# Check Kafka
docker-compose ps

# Test connectivity
curl http://localhost:3001/health
curl https://yourdomain.com/
```

### Test Socket.io connection:

Open browser DevTools (F12) → Console and check:
- No WebSocket errors
- Connection to /socket.io established
- Real-time game updates working

### Test API endpoints:

```bash
# Test API
curl https://yourdomain.com/api/

# Test Socket.io
curl https://yourdomain.com/socket.io/?transport=polling
```

## Monitoring & Logs

### Nginx logs:
```bash
sudo tail -f /var/log/nginx/tictactoe_access.log
sudo tail -f /var/log/nginx/tictactoe_error.log
```

### Apache logs:
```bash
sudo tail -f /var/log/apache2/tictactoe_access.log
sudo tail -f /var/log/apache2/tictactoe_error.log
```

### Backend logs (PM2):
```bash
pm2 logs tictactoe-backend
```

### Backend logs (systemd):
```bash
sudo journalctl -u tictactoe-backend -f
```

### Kafka logs:
```bash
docker-compose logs -f kafka
```

## Scaling Considerations

### PM2 Clustering:
Already configured in `ecosystem.config.cjs` with `exec_mode: 'cluster'` to use all CPU cores.

### Load Balancing:
If running multiple backend instances:
```nginx
# In upstream block:
upstream backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

### WebSocket Sticky Sessions:
With multiple backends, ensure Socket.io sticky sessions:
```nginx
upstream backend {
    hash $remote_addr;  # IP-based sticky sessions
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

## Troubleshooting

### WebSocket Connection Fails
- Ensure `/socket.io` proxy is configured correctly
- Check firewall rules (ports 80, 443 open)
- Verify `proxy_upgrade` and `Connection` headers in Nginx
- Verify `ProxyPass` and `ProxyPassReverse` in Apache

### 502 Bad Gateway
- Check if backend is running: `pm2 status` or `systemctl status tictactoe-backend`
- Check backend logs
- Verify port 3001 is accessible: `netstat -tuln | grep 3001`

### High Memory Usage
- Set `max_memory_restart` in PM2 config
- Monitor with: `pm2 monit`
- Check for WebSocket connection leaks

### SSL Certificate Issues
- Renewal: `sudo certbot renew --dry-run`
- Manual renewal: `sudo certbot renew`

## Backup & Recovery

### Backup application:
```bash
tar -czf kafka-tictactoe-backup.tar.gz /var/www/kafka-tictactoe
```

### Backup configuration:
```bash
sudo tar -czf nginx-backup.tar.gz /etc/nginx/
# or
sudo tar -czf apache-backup.tar.gz /etc/apache2/
```

## Updating Application

```bash
cd /var/www/kafka-tictactoe

# Pull latest code
git pull origin main

# Reinstall if dependencies changed
npm install

# Rebuild
npm run build:prod

# Update frontend
cp -r frontend/dist/* /var/www/html/

# Reload web server
sudo systemctl reload nginx  # or apache2

# Restart backend
pm2 restart tictactoe-backend
# or
sudo systemctl restart tictactoe-backend
```

## Performance Tips

1. **Enable compression** in Nginx/Apache
2. **Use CDN** for static assets
3. **Set proper cache headers** (already in configs)
4. **Monitor memory** and set limits
5. **Use HTTP/2** (Nginx: `http2`, configured)
6. **Enable HTTPS only** for production
7. **Set reasonable timeouts** for WebSocket connections
8. **Monitor Kafka broker** performance

## Security Recommendations

1. ✅ Use HTTPS (Let's Encrypt)
2. ✅ Set CORS properly to your domain only
3. ✅ Use firewall (ufw)
4. ✅ Disable root login
5. ✅ Use SSH keys instead of passwords
6. ✅ Regular updates: `sudo apt update && sudo apt upgrade`
7. ✅ Monitor logs regularly
8. ✅ Set resource limits in PM2/systemd
9. ✅ Use fail2ban for intrusion protection
10. ✅ Regular backups

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Apache Documentation](https://httpd.apache.org/docs/)
- [Socket.io Deployment Guide](https://socket.io/docs/v4/socket-io-nodejs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot Documentation](https://certbot.eff.org/)

---

**Last Updated**: February 2026
**Version**: 1.0
