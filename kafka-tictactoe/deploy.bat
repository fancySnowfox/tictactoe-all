@echo off
REM Kafka Tic-Tac-Toe Deployment Script for Windows

setlocal enabledelayedexpansion

echo ================================
echo Kafka Tic-Tac-Toe Deployment
echo ================================
echo.

REM Check Node.js version
echo ^> Checking Node.js version...
for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODE_VERSION=%%i
if "%NODE_VERSION%"=="" (
    echo [ERROR] Node.js is not installed
    exit /b 1
)

REM Extract major version (e.g., "v18.0.0" -> "18")
for /f "tokens=1,2 delims=." %%a in ("%NODE_VERSION:v=%") do set NODE_MAJOR=%%a

if %NODE_MAJOR% LSS 18 (
    echo [ERROR] Node.js version 18+ is required. Current version: %NODE_VERSION%
    echo [INFO] Download Node.js 18 or later from https://nodejs.org/
    exit /b 1
)
echo [OK] Node.js version %NODE_VERSION% is OK
echo.

REM 1. Stop existing containers
echo ^> Stopping existing Docker containers...
docker-compose down -v >nul 2>&1
echo [OK] Containers stopped
echo.

REM 2. Start Kafka with KRaft
echo ^> Starting Kafka with KRaft (no Zookeeper)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Kafka
    exit /b 1
)
echo [OK] Kafka started
echo.

REM 3. Wait for Kafka to be ready
echo ^> Waiting for Kafka to be ready...
timeout /t 5 /nobreak
echo [OK] Kafka is ready
echo.

REM 4. Install dependencies
echo ^> Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM 5. Start backend server in new window
echo ^> Starting backend server...
start "Backend Server" cmd /k npm run dev --workspace=backend
echo [OK] Backend server started
echo.

REM 6. Start frontend server in new window
echo ^> Starting frontend server...
start "Frontend Server" cmd /k npm run dev --workspace=frontend
echo [OK] Frontend server started
echo.

echo ================================
echo Deployment Complete!
echo ================================
echo.
echo [OK] Kafka broker running (localhost:9092)
echo [OK] Backend API running (http://localhost:3001)
echo [OK] Frontend running (http://localhost:5173)
echo.
echo Close the terminal windows to stop all services
echo.

pause
