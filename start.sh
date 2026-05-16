#!/usr/bin/env bash
# ====================================================================
#  PestGuard - One-command launcher (Linux / macOS)
#  Starts the Flask backend and the Vite frontend together.
# ====================================================================

set -e
cd "$(dirname "$0")"

echo
echo "=================================================="
echo "  PestGuard - starting backend + frontend"
echo "=================================================="
echo

# --- Detect LAN IP ---
if command -v ip >/dev/null 2>&1; then
    LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++)if($i=="src"){print $(i+1);exit}}')
elif command -v ifconfig >/dev/null 2>&1; then
    LAN_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi

# --- Backend setup ---
echo "[1/3] Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "      Creating virtual environment..."
    python3 -m venv venv
fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
deactivate
cd ..

# --- Frontend setup ---
echo "[2/3] Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "      Installing npm packages (first run only)..."
    npm install --silent
fi
cd ..

# --- Launch both with cleanup trap ---
echo "[3/3] Launching servers..."
echo
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:5173"
if [ -n "$LAN_IP" ]; then
    echo "  Phone:    http://$LAN_IP:5173   <-- open this from a phone on the same Wi-Fi"
fi
echo
echo "  Press Ctrl-C to stop both servers."
echo

cleanup() {
    echo
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait
    exit 0
}
trap cleanup INT TERM

# Start backend
(cd backend && source venv/bin/activate && python app.py) &
BACKEND_PID=$!

sleep 2

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

wait
