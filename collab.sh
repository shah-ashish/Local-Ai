#!/bin/bash
# Local-Ai - One-Click Google Colab Launcher
#
# Usage in a Google Colab notebook cell:
#   !curl -fsSL https://raw.githubusercontent.com/shah-ashish/Local-Ai/main/collab.sh | bash
# Or if already inside the project directory:
#   !bash collab.sh

set -e

# Configurable GitHub Repository URL
REPO_URL="${REPO_URL:-https://github.com/shah-ashish/Local-Ai.git}"
REPO_DIR="$(basename -s .git "$REPO_URL")"
CLIENT_DIR="client"
SERVER_PORT=8000
OLLAMA_MODEL="gemma3:270m"   # default model to pull

echo "=============================================="
echo "  Local-Ai - Starting on Google Colab         "
echo "=============================================="

# 0. Clone repository if project files are not in current directory
if [ ! -f "app.py" ]; then
  if [ -d "$REPO_DIR" ]; then
    echo "- Found existing project folder '$REPO_DIR'. Entering directory..."
    cd "$REPO_DIR"
  else
    echo "- Cloning repository from $REPO_URL..."
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
  fi
fi

# Pull latest code updates if git repo exists
if [ -d ".git" ]; then
  echo "- Checking for latest updates..."
  git pull origin main 2>/dev/null || true
fi

# 1. Install & Start Ollama daemon
if ! command -v ollama &> /dev/null; then
  if ! command -v zstd &> /dev/null; then
    echo "- Installing required extraction dependency (zstd)..."
    apt-get update -qq && apt-get install -y -qq zstd
  fi
  echo "- Installing Ollama daemon..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

echo "- Starting Ollama daemon in background..."
if ! pgrep -x "ollama" >/dev/null 2>&1; then
    nohup ollama serve > /content/ollama.log 2>&1 &
    sleep 5
else
    echo "- Ollama daemon already running."
fi

# Pull default Ollama model
echo "- Pulling default Ollama model ($OLLAMA_MODEL)..."
ollama pull "$OLLAMA_MODEL" || echo "Notice: Ollama pull failed. You can pull the model manually inside Colab."

# Verify GPU
echo "- Checking GPU status..."
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || echo "Notice: No GPU detected. Make sure Colab runtime is set to T4 GPU."

# 2. Install Python backend dependencies
echo "- Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
  pip install -q -r requirements.txt
else
  pip install -q fastapi uvicorn
fi

# 3. Ensure Frontend production build exists
if [ ! -d "client/dist" ]; then
  echo "- Building frontend React app..."
  if ! command -v node &> /dev/null; then
    echo "- Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
  fi
  cd client
  npm install --silent
  npm run build --silent
  cd ..
fi

# 4. Setup Cloudflared Tunnel for external web access
if ! command -v cloudflared &> /dev/null; then
  echo "- Installing Cloudflare Tunnel..."
  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i cloudflared-linux-amd64.deb > /dev/null 2>&1 || true
  rm -f cloudflared-linux-amd64.deb
fi

echo ""
echo "=============================================="
echo "  Starting Cloudflare Public Tunnel...        "
echo "=============================================="
rm -f /content/cloudflared.log cloudflared.log
nohup cloudflared tunnel --url "http://localhost:$SERVER_PORT" > /content/cloudflared.log 2>&1 &

echo "- Waiting for public tunnel URL to generate..."
TUNNEL_URL=""
for i in {1..20}; do
  TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' /content/cloudflared.log 2>/dev/null | head -n 1 || true)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
  sleep 1
done

echo ""
echo "--------------------------------------------------------"
if [ -n "$TUNNEL_URL" ]; then
  echo "  🎉 LOCAL AI IS RUNNING ONLINE!"
  echo ""
  echo "  Click this link to open the app in your browser:"
  echo "  👉 $TUNNEL_URL"
else
  echo "  Tunnel started. Run 'cat /content/cloudflared.log' to get your link."
fi
echo "--------------------------------------------------------"
echo "  Note: Do NOT click http://0.0.0.0:$SERVER_PORT (internal IP)."
echo "  Always use the trycloudflare.com link above!"
echo "--------------------------------------------------------"
echo ""

# 5. Launch FastAPI application server
echo "- Launching FastAPI backend server on port $SERVER_PORT..."
python3 -m uvicorn app:app --host 0.0.0.0 --port "$SERVER_PORT"