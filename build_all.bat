@echo off
setlocal enabledelayedexpansion

:: Ensure the script runs from the repository root directory
cd /d "%~dp0"

title AI Grammar Studio - Full Release Build (.EXE + .MSIX)

echo =======================================================
echo     AI Grammar Studio - Building .EXE and .MSIX
echo =======================================================
echo Identity Name:       Saayan.AIGrammerStudio
echo Publisher:           CN=37E2AF47-D2FC-489C-BDC1-02C989A7B989
echo Publisher Display:   Saayan
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

:: Clean temporary caches and old build files
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

echo [3/3] Packaging Windows Releases (.EXE Installer + .MSIX Store Package)...
:: Ensure all AppX visual assets exist
if not exist "build\appx\Square150x150Logo.png" (
    echo Generating AppX visual assets from build\icon.png...
    powershell -ExecutionPolicy Bypass -File scripts\generate-icons.ps1
)

:: Clean previous dist artifacts to avoid file locks
if exist "dist" rmdir /s /q "dist" 2>nul

:: Build both NSIS and AppX targets in a single electron-builder pass
call npx electron-builder --win nsis appx --x64
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================
echo [SUCCESS] All Windows builds (.EXE + .MSIX) generated!
echo Output Directory: dist\
echo =======================================================
echo.
pause
