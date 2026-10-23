@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Starting portfolio at http://localhost:3000
  start "" "http://localhost:3000"
  node server.js
) else (
  echo Node.js is not installed. Opening the site directly in your browser.
  start "" "%~dp0index.html"
  echo You can also install Node.js and run: npm start
  pause
)
