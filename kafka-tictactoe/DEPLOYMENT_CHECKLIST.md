# Deployment Checklist

## Pre-Deployment

- [ ] Code reviewed and tested locally
- [ ] All dependencies updated
- [ ] Environment variables documented
- [ ] Database migrations tested (if applicable)
- [ ] Kafka configuration ready
- [ ] Domain name ready
- [ ] SSL certificate plan (Let's Encrypt)
- [ ] Backup strategy documented

## Server Preparation

- [ ] Linux server provisioned (Ubuntu 20.04+)
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Node.js 18+ installed
- [ ] npm updated: `npm install -g npm@latest`
- [ ] PM2 installed globally: `sudo npm install -g pm2`
- [ ] Docker and docker-compose installed
- [ ] Git configured: `git config --global user.name/email`
- [ ] SSH keys setup for deployment

## Application Deployment

- [ ] Repository cloned to `/var/www/kafka-tictactoe`
- [ ] Dependencies installed: `npm install`
- [ ] Environment variables configured
- [ ] Application built: `npm run build:prod`
- [ ] Frontend deployed to `/var/www/html`
- [ ] Backend built: `npm run build:prod --workspace=backend`

## Web Server Setup (Choose One)

### Nginx
- [ ] Nginx installed: `sudo apt install -y nginx`
- [ ] `nginx.conf.example` copied to `/etc/nginx/sites-available/tictactoe`
- [ ] Domain name updated in config
- [ ] Site enabled: `sudo a2ensite tictactoe` (Nginx: `ln -s ...`)
- [ ] Configuration tested: `sudo nginx -t`
- [ ] Nginx started and enabled: `sudo systemctl enable nginx`
- [ ] Service running: `sudo systemctl status nginx`

### Apache
- [ ] Apache installed: `sudo apt install -y apache2`
- [ ] Required modules enabled:
  - [ ] `sudo a2enmod proxy`
  - [ ] `sudo a2enmod proxy_http`
  - [ ] `sudo a2enmod proxy_wstunnel`
  - [ ] `sudo a2enmod rewrite`
  - [ ] `sudo a2enmod headers`
- [ ] `apache.conf.example` copied to `/etc/apache2/sites-available/tictactoe.conf`
- [ ] Domain name updated in config
- [ ] Site enabled: `sudo a2ensite tictactoe`
- [ ] Configuration tested: `sudo apache2ctl configtest`
- [ ] Apache started and enabled: `sudo systemctl enable apache2`
- [ ] Service running: `sudo systemctl status apache2`

## Backend Service Setup (Choose One)

### PM2
- [ ] PM2 installed globally
- [ ] `ecosystem.config.example.cjs` copied to `ecosystem.config.cjs`
- [ ] Configuration updated with correct paths and environment variables
- [ ] Backend started: `pm2 start ecosystem.config.cjs --env production`
- [ ] Startup configured: `pm2 startup` and `pm2 save`
- [ ] Service running: `pm2 status`
- [ ] Logs readable: `pm2 logs tictactoe-backend`

### systemd
- [ ] `tictactoe-backend.service.example` copied to `/etc/systemd/system/tictactoe-backend.service`
- [ ] Configuration updated with correct paths and environment variables
- [ ] systemd reloaded: `sudo systemctl daemon-reload`
- [ ] Service enabled: `sudo systemctl enable tictactoe-backend`
- [ ] Service started: `sudo systemctl start tictactoe-backend`
- [ ] Service running: `sudo systemctl status tictactoe-backend`

## Kafka Setup

- [ ] Docker Compose file ready
- [ ] Kafka containers started: `docker-compose up -d`
- [ ] Containers running: `docker-compose ps`
- [ ] Kafka accessible on port 9092
- [ ] Logs reviewed: `docker-compose logs -f kafka`

## SSL/HTTPS Setup

- [ ] Certbot installed
- [ ] SSL certificate obtained:
  - [ ] Nginx: `sudo certbot --nginx -d yourdomain.com`
  - [ ] Apache: `sudo certbot --apache -d yourdomain.com`
- [ ] Certificate auto-renewal configured: `sudo systemctl enable certbot.timer`
- [ ] HTTPS working: `https://yourdomain.com`
- [ ] HTTP redirects to HTTPS

## Testing & Verification

### Connectivity Tests
- [ ] Port 80 (HTTP) accessible
- [ ] Port 443 (HTTPS) accessible
- [ ] Port 3001 (Backend) NOT publicly accessible
- [ ] Firewall rules correct

### Application Tests
- [ ] Frontend loads: `https://yourdomain.com/`
- [ ] API endpoint responds: `curl https://yourdomain.com/api/`
- [ ] Socket.io connects (check browser console for no errors)
- [ ] Game functionality works end-to-end
- [ ] WebSocket communication working (real-time updates)

### Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] No WebSocket connection errors
- [ ] Backend responsive (check PM2/systemd logs)
- [ ] Memory usage stable
- [ ] CPU usage reasonable

### Security Tests
- [ ] SSL/TLS grade A+ (ssllabs.com)
- [ ] No mixed content (HTTP/HTTPS)
- [ ] CORS headers correct
- [ ] No sensitive data in logs
- [ ] Environment variables secured

## Monitoring Setup

- [ ] PM2 or systemd monitoring configured
- [ ] Log rotation setup
- [ ] Uptime monitoring (optional: StatusCake, uptime.com)
- [ ] Error notifications configured (optional)
- [ ] Backup script created
- [ ] Backup tested

## Documentation

- [ ] Deployment steps documented
- [ ] Emergency procedures documented
- [ ] Recovery procedures tested
- [ ] Team members trained
- [ ] Configuration backed up

## Post-Deployment

- [ ] Monitor for 24 hours
- [ ] Check logs daily for errors
- [ ] Verify backups working
- [ ] Performance baseline established
- [ ] Alert thresholds set
- [ ] Team notified of deployment

## Rollback Plan

- [ ] Previous version backed up
- [ ] Rollback procedure documented
- [ ] Database rollback plan ready
- [ ] Quick revert commands prepared

## Maintenance Schedule

- [ ] Daily: Check logs and system health
- [ ] Weekly: Update dependencies
- [ ] Monthly: SSL certificate renewal check
- [ ] Quarterly: Security audit
- [ ] Annually: Full system review

---

**Deployment Date**: [Date]
**Deployed By**: [Name]
**Status**: [ ] In Progress [ ] Completed [ ] Rolled Back

**Notes**:
[Add any deployment notes here]
