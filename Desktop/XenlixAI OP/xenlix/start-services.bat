@echo off
title XenlixAI AEO Platform Startup

echo.
echo ==============================================
echo    XenlixAI AEO Platform with Crawl4AI
echo ==============================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell is required but not found
    echo Please install PowerShell or use Windows 10/11
    pause
    exit /b 1
)

echo Starting services with PowerShell...
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "start-services.ps1"

echo.
echo Services stopped. Press any key to exit...
pause >nul