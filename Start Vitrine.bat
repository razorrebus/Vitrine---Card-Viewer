@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    set "PYCMD=python"
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        set "PYCMD=py"
    ) else (
        echo Python wasn't found on this computer, so Vitrine can't start its own server.
        echo Install Python from https://python.org, then double-click this file again.
        echo.
        pause
        exit /b 1
    )
)

start "Vitrine server - keep this window open while using the app" cmd /k %PYCMD% -m http.server 8123
timeout /t 2 /nobreak >nul
start "" http://localhost:8123/card-viewer.html
