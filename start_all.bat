@echo off
title Intelligent Helpdesk - All Services Starter
echo =====================================================================
echo  Starting Intelligent Helpdesk System with AI Root Cause Mapping
echo =====================================================================
echo.

echo 1. Starting Python Machine Learning Microservice on Port 5001...
start "AI ML Service" cmd /k "cd /d %~dp0ml-service && .\venv\Scripts\python.exe app.py"

timeout /t 2 /nobreak >nul

echo 2. Starting Node.js / Express Backend API on Port 5000...
start "Express Backend API" cmd /k "cd /d %~dp0server && npm start"

timeout /t 2 /nobreak >nul

echo 3. Starting React / Vite Frontend on Port 3000...
start "React Vite Frontend" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo =====================================================================
echo  All services launched! Opening web application in your browser...
echo  URL: http://localhost:3000
echo =====================================================================
start http://localhost:3000
pause
