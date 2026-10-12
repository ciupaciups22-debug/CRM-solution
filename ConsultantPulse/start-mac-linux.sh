#!/usr/bin/env bash
# ConsultantPulse CRM - macOS / Linux start script (without Docker).
# Needs: Python 3.11+, Node.js 20+, MongoDB Community Server running on localhost:27017.
set -e
cd "$(dirname "$0")"

command -v python3 >/dev/null || { echo "Python 3 is not installed: https://www.python.org/downloads/"; exit 1; }
command -v npm >/dev/null || { echo "Node.js is not installed: https://nodejs.org/"; exit 1; }

echo "=== Setting up backend (first run takes a few minutes) ==="
cd backend
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
pip install -q -r requirements.txt
python load_data.py || { echo "Could not reach MongoDB on localhost:27017 - install/start MongoDB Community Server"; exit 1; }
uvicorn server:app --host 127.0.0.1 --port 8001 &
BACK=$!
cd ..

echo "=== Setting up frontend ==="
cd frontend
[ -d node_modules ] || npm install --no-audit --no-fund
npm run dev &
FRONT=$!
cd ..

trap 'kill $BACK $FRONT 2>/dev/null' EXIT INT TERM
sleep 5
(command -v open >/dev/null && open http://localhost:3000) || (command -v xdg-open >/dev/null && xdg-open http://localhost:3000) || true
echo "ConsultantPulse is running at http://localhost:3000 - press Ctrl+C to stop."
wait
