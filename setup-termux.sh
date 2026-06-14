#!/data/data/com.termux.app/files/usr/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

clear
echo -e "${YELLOW}${BOLD}PokePoke — Eerste installatie${RESET}"
echo "════════════════════════════════"
echo ""

# 1. Termux packages
echo -e "${CYAN}[1/5]${RESET} Termux pakketten updaten..."
pkg update -y -q && pkg upgrade -y -q
pkg install -y -q nodejs git termux-api 2>/dev/null
echo -e "${GREEN}✓  Node $(node -v) · Git $(git --version | cut -d' ' -f3)${RESET}"
echo ""

# 2. Clone repo
echo -e "${CYAN}[2/5]${RESET} Repository klonen..."
if [ -d "$HOME/Pokepoke" ]; then
  echo "   Map bestaat al — updaten..."
  cd "$HOME/Pokepoke" && git pull origin claude/pokemon-card-tracker-7z53tc -q
else
  git clone -q --branch claude/pokemon-card-tracker-7z53tc \
    https://github.com/ChefJoost/Pokepoke.git "$HOME/Pokepoke"
fi
cd "$HOME/Pokepoke"
echo -e "${GREEN}✓  Klaar${RESET}"
echo ""

# 3. npm install
echo -e "${CYAN}[3/5]${RESET} Dependencies installeren (even geduld)..."
npm install --silent
echo -e "${GREEN}✓  Klaar${RESET}"
echo ""

# 4. Build frontend
echo -e "${CYAN}[4/5]${RESET} Frontend bouwen..."
npm run build --silent 2>/dev/null
echo -e "${GREEN}✓  Klaar${RESET}"
echo ""

# 5. Widget shortcut aanmaken
echo -e "${CYAN}[5/5]${RESET} Startknop instellen..."
mkdir -p "$HOME/.shortcuts"
cat > "$HOME/.shortcuts/PokePoke.sh" << 'SHORTCUT'
#!/data/data/com.termux.app/files/usr/bin/bash
cd "$HOME/Pokepoke" && bash start.sh
SHORTCUT
chmod +x "$HOME/.shortcuts/PokePoke.sh"
echo -e "${GREEN}✓  Widget shortcut aangemaakt${RESET}"
echo ""

echo "════════════════════════════════"
echo -e "${GREEN}${BOLD}✓  Installatie klaar!${RESET}"
echo ""
echo -e "  ${BOLD}App starten:${RESET}"
echo -e "  ${CYAN}cd ~/Pokepoke && bash start.sh${RESET}"
echo ""
echo -e "  ${BOLD}Of via widget:${RESET}"
echo -e "  Installeer ${YELLOW}Termux:Widget${RESET} uit F-Droid,"
echo -e "  voeg widget toe aan homescreen → kies ${YELLOW}PokePoke${RESET}"
echo ""
