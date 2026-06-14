import Dexie from 'dexie';

export const db = new Dexie('pokepoke');

db.version(1).stores({
  cards: '++id, name, set_name, set_id, rarity, language, location, pokemontcg_id, created_at',
  price_history: '++id, card_id, date',
  wishlist: '++id, name, set_name, pokemontcg_id, created_at',
});
