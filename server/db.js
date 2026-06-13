const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'pokepoke.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    set_name TEXT,
    set_id TEXT,
    set_number TEXT,
    rarity TEXT,
    language TEXT DEFAULT 'EN',
    condition TEXT DEFAULT 'NM',
    is_graded INTEGER DEFAULT 0,
    grade REAL,
    grading_company TEXT,
    quantity INTEGER DEFAULT 1,
    location TEXT,
    purchase_price REAL,
    purchase_date TEXT,
    purchase_source TEXT,
    pokemontcg_id TEXT,
    image_url TEXT,
    tags TEXT DEFAULT '[]',
    notes TEXT,
    current_price REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    price REAL,
    trend_price REAL,
    avg_sell_price REAL,
    low_price REAL,
    source TEXT DEFAULT 'pokemontcg',
    date TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    set_name TEXT,
    set_id TEXT,
    set_number TEXT,
    rarity TEXT,
    language TEXT DEFAULT 'EN',
    condition TEXT DEFAULT 'NM',
    max_price REAL,
    pokemontcg_id TEXT,
    image_url TEXT,
    notes TEXT,
    current_price REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
