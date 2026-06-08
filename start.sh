#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# start.sh — Launch script for the scan server in Termux
# Starts Ollama in the background, waits for it, then runs Flask
# ============================================================

echo "🚀 Starting scan server..."

# 1. Start ollama serve in the background via proot-distro
proot-distro login ubuntu -- bash -c "ollama serve" &
OLLAMA_PID=$!

echo "⏳ Waiting for Ollama to start..."

# 2. Wait up to 30 seconds for Ollama health check
MAX_WAIT=30
ELAPSED=0
OLLAMA_READY=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        OLLAMA_READY=true
        echo "✅ Ollama is ready (took ${ELAPSED}s)"
        break
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
done

# 3. If Ollama didn't start — warn but continue
if [ "$OLLAMA_READY" = false ]; then
    echo "⚠️  Ollama did not start within ${MAX_WAIT}s."
    echo "   The server will run without AI parsing (regex fallback only)."
fi

# 4. Run the Flask scan server
echo "🟢 Starting Flask server on port 5000..."
python scan_server.py
