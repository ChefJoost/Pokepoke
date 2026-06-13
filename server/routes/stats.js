const express = require('express');
const router = express.Router();
const db = require('../db');

// Dashboard stats
router.get('/', (req, res) => {
  try {
    const totalCards = db.prepare('SELECT COALESCE(SUM(quantity), 0) as count FROM cards').get().count;
    const totalValue = db.prepare('SELECT COALESCE(SUM(current_price * quantity), 0) as val FROM cards').get().val;
    const totalSets = db.prepare('SELECT COUNT(DISTINCT set_name) as count FROM cards WHERE set_name IS NOT NULL').get().count;
    const totalCost = db.prepare('SELECT COALESCE(SUM(purchase_price * quantity), 0) as val FROM cards WHERE purchase_price IS NOT NULL').get().val;

    const topCards = db.prepare(`
      SELECT id, name, set_name, current_price, image_url, quantity
      FROM cards
      WHERE current_price IS NOT NULL
      ORDER BY current_price * quantity DESC
      LIMIT 10
    `).all();

    // Value over time from price_history (group by date, sum latest price per card)
    const priceHistory = db.prepare(`
      SELECT date(ph.date) as day, SUM(ph.price * c.quantity) as total_value
      FROM price_history ph
      JOIN cards c ON c.id = ph.card_id
      WHERE ph.id IN (
        SELECT MAX(id) FROM price_history GROUP BY card_id, date(date)
      )
      GROUP BY day
      ORDER BY day ASC
      LIMIT 90
    `).all();

    res.json({ totalCards, totalValue, totalSets, totalCost, topCards, priceHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sets progress
router.get('/sets', (req, res) => {
  try {
    const ownedSets = db.prepare(`
      SELECT set_name, set_id, COUNT(DISTINCT set_number) as owned_count,
             GROUP_CONCAT(DISTINCT set_number) as owned_numbers
      FROM cards
      WHERE set_name IS NOT NULL AND set_number IS NOT NULL
      GROUP BY set_name, set_id
      ORDER BY set_name
    `).all();

    res.json(ownedSets.map(s => ({
      ...s,
      owned_numbers: s.owned_numbers ? s.owned_numbers.split(',') : []
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Distinct filter values
router.get('/filters', (req, res) => {
  try {
    const sets = db.prepare('SELECT DISTINCT set_name FROM cards WHERE set_name IS NOT NULL ORDER BY set_name').all().map(r => r.set_name);
    const rarities = db.prepare('SELECT DISTINCT rarity FROM cards WHERE rarity IS NOT NULL ORDER BY rarity').all().map(r => r.rarity);
    const languages = db.prepare('SELECT DISTINCT language FROM cards WHERE language IS NOT NULL ORDER BY language').all().map(r => r.language);
    const locations = db.prepare('SELECT DISTINCT location FROM cards WHERE location IS NOT NULL ORDER BY location').all().map(r => r.location);
    res.json({ sets, rarities, languages, locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
