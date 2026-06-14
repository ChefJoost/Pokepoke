require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/cards', require('./routes/cards'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/pokemon', require('./routes/pokemon'));
app.use('/api/stats', require('./routes/stats'));

// Serve static frontend in production
const DIST = path.join(__dirname, '..', 'dist');
if (require('fs').existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, () => {
  const hasApiKey = !!process.env.POKEMONTCG_API_KEY;
  console.log(`✓  API routes klaar`);
  console.log(`✓  Database verbonden`);
  console.log(`${hasApiKey ? '✓' : '⚠'}  PokémonTCG API key: ${hasApiKey ? 'aanwezig' : 'ontbreekt (werkt nog wel, maar gelimiteerd)'}`);
});
