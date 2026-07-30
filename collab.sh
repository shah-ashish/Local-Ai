#!/bin/bash
# collab.sh — run Local-Ai on Google Colab
# Usage in a Colab cell:
#   !bash collab.sh
# or
#   !wget -qO collab.sh https://raw.githubusercontent.com/shah-ashish/Local-Ai/main/collab.sh && bash collab.sh

set -uo pipefail   # NOTE: not using -e, because we want controlled error messages, not silent kills

REPO_URL="https://github.com/shah-ashish/Local-Ai.git"
REPO_DIR="Local-Ai"
CLIENT_DIR="client"
SERVER_PORT=8000
OLLAMA_MODEL="gemma3:270m"   # change if you want a different default model pulled

log()  { echo -e "\n============================\n$1\n============================"; }
fail() { echo -e "\n[FATAL] $1"; exit 1; }

# ---------------------------------------------------------------------------
# 1. Fetch or update the repo
# ---------------------------------------------------------------------------
log "Step 1: Fetching repo"

if [ -d "$REPO_DIR/.git" ]; then
    echo "Repo already exists, pulling latest..."
    git -C "$REPO_DIR" pull origin main || fail "git pull failed"
else
    git clone "$REPO_URL" "$REPO_DIR" || fail "git clone failed"
fi

cd "$REPO_DIR" || fail "Could not cd into $REPO_DIR"

# ---------------------------------------------------------------------------
# 2. System deps: zstd, cloudflared
# ---------------------------------------------------------------------------
log "Step 2: Installing system packages (zstd, python3-venv)"

apt-get update -qq
apt-get install -y -qq zstd python3-venv || fail "zstd/python3-venv install failed"

# ---------------------------------------------------------------------------
# 3. Install Ollama and start the server
# ---------------------------------------------------------------------------
log "Step 3: Installing and starting Ollama"

if ! command -v ollama >/dev/null 2>&1; then
    curl -fsSL https://ollama.com/install.sh | sh || fail "Ollama install failed"
else
    echo "Ollama already installed."
fi

# Start ollama serve in the background if it's not already running
if ! pgrep -x "ollama" >/dev/null 2>&1; then
    echo "Starting ollama serve in background..."
    nohup ollama serve > /content/ollama.log 2>&1 &
    # Give it a few seconds to bind to its port before anything tries to use it
    sleep 5
else
    echo "Ollama server already running."
fi

# Pull the model (safe to re-run; no-op if already present)
ollama pull "$OLLAMA_MODEL" || echo "[WARN] ollama pull failed — check /content/ollama.log"

# ---------------------------------------------------------------------------
# 4. Build the React client
# ---------------------------------------------------------------------------
log "Step 4: Building client"

if [ ! -d "$CLIENT_DIR" ]; then
    fail "'$CLIENT_DIR' folder not found in repo. Expected structure: $REPO_DIR/$CLIENT_DIR/... Push your React app to the repo first."
fi

if [ ! -f "$CLIENT_DIR/package.json" ]; then
    fail "No package.json in '$CLIENT_DIR'. Cannot build client."
fi

# Node.js — Colab images usually ship one, but pin a modern LTS to be safe
if ! command -v node >/dev/null 2>&1; then
    echo "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs || fail "Node.js install failed"
fi

pushd "$CLIENT_DIR" >/dev/null
npm install --silent || fail "npm install failed in $CLIENT_DIR"
npm run build --silent || fail "npm run build failed in $CLIENT_DIR"
# Assumes Vite (outputs to 'dist/'). If this project uses CRA instead, change
# to 'build/' both here and wherever app.py serves static files from.
[ -d "dist" ] || echo "[WARN] no 'dist/' folder after build — check the build tool being used (Vite vs CRA)"
popd >/dev/null

# ---------------------------------------------------------------------------
# 5. Python venv + requirements
# ---------------------------------------------------------------------------
log "Step 5: Setting up Python environment"

if [ ! -f "app.py" ]; then
    fail "app.py not found in repo root. FastAPI server cannot start without it."
fi

# If .venv exists but is incomplete/broken (e.g. missing activation script), remove it to start fresh
if [ -d ".venv" ] && [ ! -f ".venv/bin/activate" ]; then
    echo "Found broken or incomplete .venv, removing it to start fresh..."
    rm -rf .venv
fi

python3 -m venv .venv || fail "venv creation failed"
source .venv/bin/activate

python -m pip install --upgrade pip --quiet

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet || fail "pip install -r requirements.txt failed"
else
    echo "[WARN] requirements.txt not found — skipping. uvicorn/fastapi may not be installed."
    pip install fastapi uvicorn --quiet
fi

# ---------------------------------------------------------------------------
# 6. Cloudflare tunnel
# ---------------------------------------------------------------------------
log "Step 6: Setting up Cloudflare tunnel"

if ! command -v cloudflared >/dev/null 2>&1; then
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared \
        || fail "cloudflared download failed"
    chmod +x cloudflared
    mv cloudflared /usr/local/bin/cloudflared
fi

# Quick/anonymous tunnel — no Cloudflare account or token required.
# Prints a random *.trycloudflare.com URL that proxies to localhost:$SERVER_PORT.
# If you have a named tunnel + token instead, replace this line with:
#   cloudflared tunnel run <tunnel-name> &
nohup cloudflared tunnel --url "http://localhost:$SERVER_PORT" > /content/cloudflared.log 2>&1 &
sleep 5
echo "Tunnel starting — check /content/cloudflared.log for the public URL:"
grep -o "https://.*trycloudflare.com" /content/cloudflared.log || echo "(URL not yet visible, check the log in a few seconds: cat /content/cloudflared.log)"

# ---------------------------------------------------------------------------
# 7. Start the server
# ---------------------------------------------------------------------------
log "Step 7: Starting server on port $SERVER_PORT"

uvicorn app:app --host 0.0.0.0 --port "$SERVER_PORT" --reload