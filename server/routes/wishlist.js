const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM wishlist ORDER BY created_at DESC').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM wishlist WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { name, set_name, set_id, set_number, rarity, language, condition, max_price, pokemontcg_id, image_url, notes, current_price } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db.prepare(`
      INSERT INTO wishlist (name, set_name, set_id, set_number, rarity, language, condition, max_price, pokemontcg_id, image_url, notes, current_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, set_name, set_id, set_number, rarity, language || 'EN', condition || 'NM', max_price, pokemontcg_id, image_url, notes, current_price);
    const item = db.prepare('SELECT * FROM wishlist WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, set_name, set_id, set_number, rarity, language, condition, max_price, pokemontcg_id, image_url, notes, current_price } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM wishlist WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare(`
      UPDATE wishlist SET name=?, set_name=?, set_id=?, set_number=?, rarity=?, language=?, condition=?,
        max_price=?, pokemontcg_id=?, image_url=?, notes=?, current_price=? WHERE id=?
    `).run(name, set_name, set_id, set_number, rarity, language, condition, max_price, pokemontcg_id, image_url, notes, current_price, req.params.id);
    res.json(db.prepare('SELECT * FROM wishlist WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM wishlist WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
