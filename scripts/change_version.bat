@echo off
setlocal enabledelayedexpansion

:: Ensure the script runs from the repository root directory
cd /d "%~dp0.."

title AI Grammar Studio - Change Application Version

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Run version update script (in the same scripts directory)
node "%~dp0set-version.js" %1

if %errorlevel% neq 0 (
    pause
    exit /b %errorlevel%
)

echo Would you like to build new packages now?
echo  [1] Build All (.EXE + .MSIX)
echo  [2] Build .EXE Installer only
echo  [3] Build .MSIX Store Package only
echo  [4] Exit
echo.
set /p choice="Enter option [1-4] (default: 4): "

if "%choice%"=="1" (
    call "%~dp0build_all.bat"
) else if "%choice%"=="2" (
    call "%~dp0build_exe.bat"
) else if "%choice%"=="3" (
    call "%~dp0build_msix.bat"
) else (
    echo Done.
    pause
)
