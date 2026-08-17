@echo off
setlocal enabledelayedexpansion

:: Ensure the script runs from the repository root directory
cd /d "%~dp0.."

title AI Grammar Studio - Build Windows Installer (.EXE)

echo =======================================================
echo     AI Grammar Studio - Building Windows Setup (.EXE)
echo =======================================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check npm installation
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in PATH.
    echo.
    pause
    exit /b 1
)

:: Clean temporary caches
if exist "node_modules\@xenova\transformers\.cache" (
    echo Cleaning temporary transformers cache...
    rmdir /s /q "node_modules\@xenova\transformers\.cache" 2>nul
)

echo [1/3] Compiling TypeScript Main Process and Worker...
call npm run compile:main
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed!
    pause
    exit /b %errorlevel%
)

echo [2/3] Building Vite React Frontend...
call npm run compile:renderer
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %errorlevel%
)

echo [3/3] Packaging Windows EXE Installer (NSIS)...
call npx electron-builder --win nsis --x64
if %errorlevel% neq 0 (
    echo [ERROR] Electron packaging failed!
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================
echo [SUCCESS] Windows Installer (.EXE) generated successfully!
echo Output Directory: dist\
echo =======================================================
echo.
pause
