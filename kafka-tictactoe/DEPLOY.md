# System Service Deployment Guide

This guide explains how to deploy Kafka Tic-Tac-Toe as a system service.

## Overview

Two deployment methods are provided:
- **Windows**: [deploy-windows.bat](deploy-windows.bat) using PM2
- **Linux**: [deploy-linux.sh](deploy-linux.sh) using systemd

## Files Included

- **ecosystem.config.js** - PM2 configuration (Windows & Linux alternative)
- **deploy-windows.bat** - Windows service setup script
- **deploy-linux.sh** - Linux systemd setup script
- **DEPLOY.md** - This file

---

## Windows Deployment (PM2)

### Prerequisites
- Windows 10/11 or Server 2019+
- Node.js installed
- Administrator access

### Installation

1. **Run as Administrator**
   ```
   Right-click cmd.exe → "Run as Administrator"
   cd C:\sources\git\kafka-tictactoe
   deploy-windows.bat
   ```

2. **What it does:**
   - Installs PM2 globally (Node process manager)
   - Installs project dependencies
   - Starts backend and frontend services
   - Registers PM2 as Windows service for auto-startup

### Usage

```powershell
# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# View startup log
Get-EventLog -LogName Application -Source "PM2" -Newest 10
```

### Auto-Restart

Services automatically restart:
- ✓ On system reboot
- ✓ If process crashes
- ✓ On port conflict

---

## Linux Deployment (systemd)

### Prerequisites
- Ubuntu 20.04+ or Debian 10+
- Node.js installed
- `sudo` or root access

### Installation

```bash
# Navigate to project
cd /home/user/kafka-tictactoe

# Run as root or with sudo
sudo bash deploy-linux.sh
```

### What it does:
- Creates non-root user `appuser` for security
- Installs project dependencies
- Creates systemd service file
- Enables auto-startup on reboot
- Starts the service immediately

### Usage

```bash
# Check status
sudo systemctl status tictactoe

# View logs
sudo journalctl -u tictactoe -f

# Restart service
sudo systemctl restart tictactoe

# Stop service
sudo systemctl stop tictactoe

# Start service
sudo systemctl start tictactoe

# Follow application logs
sudo tail -f ./logs/tictactoe.log
```

### Auto-Restart

Services automatically restart:
- ✓ On system reboot
- ✓ If process crashes (RestartSec=5)
- ✓ On port conflict

---

## DigitalOcean Droplet Setup

### Step 1: SSH into Droplet

```bash
ssh root@147.182.199.133
```

### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Start Kafka

```bash
docker-compose up -d
docker-compose logs broker  # Verify it started
```

### Step 4: Deploy Application

```bash
cd /path/to/kafka-tictactoe
sudo bash deploy-linux.sh
```

### Step 5: Verify Services

```bash
sudo systemctl status tictactoe
curl http://localhost:3001/health  # Should return {"status":"ok"}
```

---

## Environment Variables

Before deployment, set these on your Droplet:

### Kafka Variables
```bash
export KAFKA_BROKER=localhost:9092
export KAFKA_USERNAME=
export KAFKA_PASSWORD=
```

### Application Variables
```bash
export NODE_ENV=production
export PORT=3001
```

### For systemd (Linux)
Edit `/etc/systemd/system/tictactoe.service`:
```ini
Environment="KAFKA_BROKER=your-broker:9092"
Environment="KAFKA_USERNAME=your-username"
Environment="KAFKA_PASSWORD=your-password"
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart tictactoe
```

---

## Monitoring

### Windows (PM2)
```powershell
pm2 monit          # Real-time monitoring
pm2 logs backend   # Backend logs only
pm2 logs frontend  # Frontend logs only
```

### Linux (systemd)
```bash
sudo journalctl -u tictactoe -f        # Real-time logs
sudo systemctl status tictactoe        # Current status
ps aux | grep node                     # Running processes
```

---

## Troubleshooting

### Windows: "Access Denied"
- Run command prompt as Administrator
- Restart PM2: `pm2 kill` then re-run deploy script

### Linux: "Connection refused"
- Verify Kafka is running: `docker ps`
- Check if port 3001 is available: `sudo lsof -i :3001`
- View logs: `sudo journalctl -u tictactoe --no-pager -n 50`

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux
sudo lsof -i :3001
sudo kill -9 <PID>
```

---

## Rollback

### Windows
```powershell
pm2 delete all
pm2 kill
# Manually delete from Services if needed
```

### Linux
```bash
sudo systemctl stop tictactoe
sudo systemctl disable tictactoe
sudo rm /etc/systemd/system/tictactoe.service
sudo systemctl daemon-reload
```

---

## Production Checklist

- [ ] Kafka container is running (`docker ps`)
- [ ] Environment variables are set
- [ ] Backend listens on 0.0.0.0:3001 (not localhost)
- [ ] Frontend configured for correct API URL
- [ ] Cloudflare DNS records point to Droplet IP
- [ ] Firewall allows ports 3001 (backend) and 5173 (frontend)
- [ ] Service status is active: `systemctl status tictactoe`
- [ ] Health check works: `curl http://droplet-ip:3001/health`

---

## Support

For issues or questions:
1. Check logs: `pm2 logs` (Windows) or `journalctl -u tictactoe` (Linux)
2. Review [server.ts](backend/src/server.ts) for API configuration
3. Verify Kafka is running: `docker-compose logs broker`
