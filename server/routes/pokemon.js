const express = require('express');
const router = express.Router();
const db = require('../db');

const PTCG_BASE = 'https://api.pokemontcg.io/v2';

function ptcgHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.POKEMONTCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMONTCG_API_KEY;
  }
  return headers;
}

// Search cards on PokémonTCG.io
router.get('/search', async (req, res) => {
  const { q, page = 1, pageSize = 20 } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const url = `${PTCG_BASE}/cards?q=name:${encodeURIComponent(q)}*&page=${page}&pageSize=${pageSize}&orderBy=name`;
    const response = await fetch(url, { headers: ptcgHeaders() });
    if (!response.ok) throw new Error(`PokémonTCG API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single card from PokémonTCG.io
router.get('/card/:id', async (req, res) => {
  try {
    const url = `${PTCG_BASE}/cards/${req.params.id}`;
    const response = await fetch(url, { headers: ptcgHeaders() });
    if (!response.ok) throw new Error(`PokémonTCG API error: ${response.status}`);
    const data = await response.json();
    res.json(data.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sets
router.get('/sets', async (req, res) => {
  try {
    const url = `${PTCG_BASE}/sets?orderBy=-releaseDate&pageSize=250`;
    const response = await fetch(url, { headers: ptcgHeaders() });
    if (!response.ok) throw new Error(`PokémonTCG API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update prices for all cards that have a pokemontcg_id
router.post('/update-prices', async (req, res) => {
  try {
    const cards = db.prepare('SELECT id, pokemontcg_id FROM cards WHERE pokemontcg_id IS NOT NULL').all();
    const wishlistItems = db.prepare('SELECT id, pokemontcg_id FROM wishlist WHERE pokemontcg_id IS NOT NULL').all();

    let updated = 0;
    let errors = 0;

    for (const card of cards) {
      try {
        const url = `${PTCG_BASE}/cards/${card.pokemontcg_id}`;
        const response = await fetch(url, { headers: ptcgHeaders() });
        if (!response.ok) { errors++; continue; }
        const data = await response.json();
        const cm = data.data?.cardmarket?.prices;
        if (!cm) continue;

        const trendPrice = cm.trendPrice ?? null;
        const avgSellPrice = cm.averageSellPrice ?? null;
        const lowPrice = cm.lowPrice ?? null;
        const currentPrice = trendPrice ?? avgSellPrice ?? lowPrice;

        if (currentPrice !== null) {
          db.prepare('UPDATE cards SET current_price = ? WHERE id = ?').run(currentPrice, card.id);
          db.prepare(`
            INSERT INTO price_history (card_id, price, trend_price, avg_sell_price, low_price)
            VALUES (?, ?, ?, ?, ?)
          `).run(card.id, currentPrice, trendPrice, avgSellPrice, lowPrice);
          updated++;
        }
      } catch { errors++; }
    }

    for (const item of wishlistItems) {
      try {
        const url = `${PTCG_BASE}/cards/${item.pokemontcg_id}`;
        const response = await fetch(url, { headers: ptcgHeaders() });
        if (!response.ok) { errors++; continue; }
        const data = await response.json();
        const cm = data.data?.cardmarket?.prices;
        if (!cm) continue;
        const currentPrice = cm.trendPrice ?? cm.averageSellPrice ?? cm.lowPrice;
        if (currentPrice !== null) {
          db.prepare('UPDATE wishlist SET current_price = ? WHERE id = ?').run(currentPrice, item.id);
        }
      } catch { errors++; }
    }

    res.json({ updated, errors, total: cards.length + wishlistItems.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
