@echo off
REM Kafka Tic-Tac-Toe - Windows PM2 Service Setup
REM This script installs the app as a Windows service using PM2

setlocal enabledelayedexpansion

echo ================================
echo Kafka Tic-Tac-Toe Service Setup
echo ================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must run as Administrator
    echo Please right-click on cmd.exe and select "Run as Administrator"
    pause
    exit /b 1
)

echo [1/5] Installing PM2 globally...
call npm install -g pm2
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install PM2
    exit /b 1
)
echo [OK] PM2 installed
echo.

echo [2/5] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo [3/5] Creating logs directory...
if not exist "logs" mkdir logs
echo [OK] Logs directory ready
echo.

echo [4/5] Starting services with PM2...
call pm2 start ecosystem.config.js --env production
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    exit /b 1
)
echo [OK] Services started
echo.

echo [5/5] Installing PM2 as Windows service...
call pm2 install pm2-windows-startup
call pm2 save
echo [OK] PM2 configured for startup
echo.

echo ================================
echo Setup Complete!
echo ================================
echo.
echo Services Running:
call pm2 list
echo.
echo Commands:
echo   pm2 status                 - Check service status
echo   pm2 logs                   - View logs
echo   pm2 stop all               - Stop all services
echo   pm2 restart all            - Restart all services
echo   pm2 delete all             - Delete all services
echo.
echo Services will auto-restart on system reboot.
echo.

pause
