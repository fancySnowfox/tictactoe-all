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

REM Check Node.js version
echo [0/6] Checking Node.js version...
for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODE_VERSION=%%i
if "%NODE_VERSION%"=="" (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)

REM Extract major version (e.g., "v18.0.0" -> "18")
for /f "tokens=1,2 delims=." %%a in ("%NODE_VERSION:v=%") do set NODE_MAJOR=%%a

if %NODE_MAJOR% LSS 18 (
    echo [ERROR] Node.js version 18+ is required. Current version: %NODE_VERSION%
    echo [INFO] Download Node.js 18 or later from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js version %NODE_VERSION% is OK
echo.

echo [1/6] Installing PM2 globally...
call npm install -g pm2
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install PM2
    exit /b 1
)
echo [OK] PM2 installed
echo.

echo [2/6] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo [3/6] Creating logs directory...
if not exist "logs" mkdir logs
echo [OK] Logs directory ready
echo.

echo [4/6] Starting services with PM2...
call pm2 start ecosystem.config.js --env production
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    exit /b 1
)
echo [OK] Services started
echo.

echo [5/6] Installing PM2 as Windows service...
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
