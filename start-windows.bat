@echo off
REM ConsultantPulse CRM - Windows start script (without Docker).
REM Needs: Python 3.11+, Node.js 20+, MongoDB Community Server running on localhost:27017.
cd /d "%~dp0"

where python >nul 2>nul || (echo Python is not installed. Get it from https://www.python.org/downloads/ ^(tick "Add to PATH"^) & pause & exit /b 1)
where npm >nul 2>nul || (echo Node.js is not installed. Get it from https://nodejs.org/ & pause & exit /b 1)

echo === Setting up backend (first run takes a few minutes) ===
cd backend
if not exist .venv python -m venv .venv
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt || (echo Backend install failed & pause & exit /b 1)
python load_data.py || (echo Could not reach MongoDB on localhost:27017 - install/start MongoDB Community Server & pause & exit /b 1)
start "ConsultantPulse backend" cmd /k ".venv\Scripts\activate.bat && uvicorn server:app --host 127.0.0.1 --port 8001"
cd ..

echo === Setting up frontend ===
cd frontend
if not exist node_modules call npm install --no-audit --no-fund
start "ConsultantPulse frontend" cmd /k "npm run dev"
cd ..

timeout /t 6 >nul
start http://localhost:3000
echo ConsultantPulse is starting at http://localhost:3000 - close the two console windows to stop it.
pause
