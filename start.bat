@echo off
cd /d "%~dp0server"
if not exist node_modules call npm install
if not exist .env (copy .env.example .env && echo Open server\.env, paste your Gemini key, save, then run this file again. && notepad .env && pause && exit /b)
echo Open http://localhost:5000/demo.html
npm start
pause
