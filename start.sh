#!/data/data/com.termux.app/files/usr/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

clear

echo -e "${YELLOW}"
echo "  ██████╗  ██████╗ ██╗  ██╗███████╗"
echo "  ██╔══██╗██╔═══██╗██║ ██╔╝██╔════╝"
echo "  ██████╔╝██║   ██║█████╔╝ █████╗  "
echo "  ██╔═══╝ ██║   ██║██╔═██╗ ██╔══╝  "
echo "  ██║     ╚██████╔╝██║  ██╗███████╗"
echo "  ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝"
echo -e "${CYAN}       Kaartencollectie Tracker${RESET}"
echo ""

# Go to app directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⟳  Eerste keer opstarten — dependencies installeren...${RESET}"
  npm install --silent
  echo -e "${GREEN}✓  Klaar${RESET}"
  echo ""
fi

# Check if dist exists (built frontend)
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⟳  Frontend bouwen...${RESET}"
  npm run build --silent 2>/dev/null
  echo -e "${GREEN}✓  Klaar${RESET}"
  echo ""
fi

PORT=${PORT:-3001}
URL="http://localhost:$PORT"

echo -e "${BOLD}⚡ Server starten op ${CYAN}$URL${RESET}"
echo ""

# Start server in background briefly to check port
node server/index.js &
SERVER_PID=$!

sleep 1

# Check if server started OK
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo -e "${RED}✗  Server kon niet starten. Controleer of poort $PORT vrij is.${RESET}"
  exit 1
fi

echo -e "${GREEN}✓  Server draait (PID: $SERVER_PID)${RESET}"
echo ""
echo -e "   ${BOLD}Open in browser:${RESET} ${CYAN}$URL${RESET}"
echo ""

# Try to open browser (Termux with termux-api, or fallback)
if command -v termux-open-url &>/dev/null; then
  termux-open-url "$URL" 2>/dev/null &
  echo -e "${GREEN}✓  Browser geopend${RESET}"
elif command -v xdg-open &>/dev/null; then
  xdg-open "$URL" 2>/dev/null &
else
  echo -e "${YELLOW}→  Open je browser handmatig: ${BOLD}$URL${RESET}"
fi

echo ""
echo -e "${YELLOW}  Druk op Ctrl+C om te stoppen${RESET}"
echo "  ─────────────────────────────────"
echo ""

# Trap Ctrl+C for clean shutdown
trap "echo ''; echo -e '${YELLOW}⟳  Stoppen...${RESET}'; kill $SERVER_PID 2>/dev/null; echo -e '${GREEN}✓  PokePoke gestopt${RESET}'; exit 0" INT TERM

# Keep alive and show server logs
wait $SERVER_PID
