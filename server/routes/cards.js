const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/cards - list all cards with optional filters
router.get('/', (req, res) => {
  const { search, set_name, rarity, language, location, tag, sort = 'created_at', order = 'DESC' } = req.query;

  const allowed_sorts = ['name', 'set_name', 'current_price', 'purchase_price', 'created_at', 'rarity'];
  const sort_col = allowed_sorts.includes(sort) ? sort : 'created_at';
  const sort_dir = order === 'ASC' ? 'ASC' : 'DESC';

  let query = 'SELECT * FROM cards WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR set_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (set_name) { query += ' AND set_name = ?'; params.push(set_name); }
  if (rarity) { query += ' AND rarity = ?'; params.push(rarity); }
  if (language) { query += ' AND language = ?'; params.push(language); }
  if (location) { query += ' AND location = ?'; params.push(location); }
  if (tag) {
    query += ` AND json_each.value = ?`;
    query = `SELECT cards.* FROM cards, json_each(cards.tags) WHERE 1=1 AND json_each.value = ?`;
    params.unshift(tag);
  }

  query += ` ORDER BY ${sort_col} ${sort_dir}`;

  try {
    const cards = db.prepare(query).all(...params);
    const parsed = cards.map(c => ({ ...c, tags: JSON.parse(c.tags || '[]'), is_graded: !!c.is_graded }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:id
router.get('/:id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json({ ...card, tags: JSON.parse(card.tags || '[]'), is_graded: !!card.is_graded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards
router.post('/', (req, res) => {
  const {
    name, set_name, set_id, set_number, rarity, language, condition, is_graded, grade,
    grading_company, quantity, location, purchase_price, purchase_date, purchase_source,
    pokemontcg_id, image_url, tags, notes, current_price
  } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const stmt = db.prepare(`
      INSERT INTO cards (name, set_name, set_id, set_number, rarity, language, condition, is_graded, grade,
        grading_company, quantity, location, purchase_price, purchase_date, purchase_source,
        pokemontcg_id, image_url, tags, notes, current_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name, set_name, set_id, set_number, rarity, language || 'EN', condition || 'NM',
      is_graded ? 1 : 0, grade, grading_company, quantity || 1, location,
      purchase_price, purchase_date, purchase_source, pokemontcg_id, image_url,
      JSON.stringify(tags || []), notes, current_price
    );
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...card, tags: JSON.parse(card.tags || '[]'), is_graded: !!card.is_graded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cards/:id
router.put('/:id', (req, res) => {
  const {
    name, set_name, set_id, set_number, rarity, language, condition, is_graded, grade,
    grading_company, quantity, location, purchase_price, purchase_date, purchase_source,
    pokemontcg_id, image_url, tags, notes, current_price
  } = req.body;

  try {
    const existing = db.prepare('SELECT id FROM cards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Card not found' });

    db.prepare(`
      UPDATE cards SET name=?, set_name=?, set_id=?, set_number=?, rarity=?, language=?, condition=?,
        is_graded=?, grade=?, grading_company=?, quantity=?, location=?, purchase_price=?,
        purchase_date=?, purchase_source=?, pokemontcg_id=?, image_url=?, tags=?, notes=?, current_price=?
      WHERE id=?
    `).run(
      name, set_name, set_id, set_number, rarity, language, condition,
      is_graded ? 1 : 0, grade, grading_company, quantity, location,
      purchase_price, purchase_date, purchase_source, pokemontcg_id, image_url,
      JSON.stringify(tags || []), notes, current_price, req.params.id
    );
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    res.json({ ...card, tags: JSON.parse(card.tags || '[]'), is_graded: !!card.is_graded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cards/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Card not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/:id/price-history
router.get('/:id/price-history', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM price_history WHERE card_id = ? ORDER BY date DESC').all(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
