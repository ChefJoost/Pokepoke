import { db } from '../db/index.js';

const PTCG_BASE = 'https://api.pokemontcg.io/v2';

async function ptcgFetch(path) {
  const res = await fetch(`${PTCG_BASE}${path}`);
  if (!res.ok) throw new Error(`PokémonTCG API fout: ${res.status}`);
  return res.json();
}

function now() {
  return new Date().toISOString();
}

export const api = {
  // ── Cards ──────────────────────────────────────────────
  async getCards(params = {}) {
    const { search, set_name, rarity, language, location, sort = 'created_at', order = 'DESC' } = params;

    let cards = await db.cards.toArray();

    if (search) {
      const q = search.toLowerCase();
      cards = cards.filter(c => c.name?.toLowerCase().includes(q) || c.set_name?.toLowerCase().includes(q));
    }
    if (set_name) cards = cards.filter(c => c.set_name === set_name);
    if (rarity)   cards = cards.filter(c => c.rarity === rarity);
    if (language) cards = cards.filter(c => c.language === language);
    if (location) cards = cards.filter(c => c.location === location);

    cards.sort((a, b) => {
      const av = a[sort] ?? '';
      const bv = b[sort] ?? '';
      if (av < bv) return order === 'ASC' ? -1 : 1;
      if (av > bv) return order === 'ASC' ? 1 : -1;
      return 0;
    });

    return cards;
  },

  async getCard(id) {
    const card = await db.cards.get(Number(id));
    if (!card) throw new Error('Kaart niet gevonden');
    return card;
  },

  async createCard(data) {
    const card = { ...data, tags: data.tags || [], created_at: now() };
    const id = await db.cards.add(card);
    return { ...card, id };
  },

  async updateCard(id, data) {
    await db.cards.update(Number(id), { ...data, tags: data.tags || [] });
    return db.cards.get(Number(id));
  },

  async deleteCard(id) {
    await db.cards.delete(Number(id));
    await db.price_history.where('card_id').equals(Number(id)).delete();
    return { success: true };
  },

  async getCardPriceHistory(id) {
    return db.price_history.where('card_id').equals(Number(id)).reverse().sortBy('date');
  },

  // ── Wishlist ────────────────────────────────────────────
  async getWishlist() {
    return db.wishlist.orderBy('created_at').reverse().toArray();
  },

  async getWishlistItem(id) {
    return db.wishlist.get(Number(id));
  },

  async createWishlistItem(data) {
    const item = { ...data, created_at: now() };
    const id = await db.wishlist.add(item);
    return { ...item, id };
  },

  async updateWishlistItem(id, data) {
    await db.wishlist.update(Number(id), data);
    return db.wishlist.get(Number(id));
  },

  async deleteWishlistItem(id) {
    await db.wishlist.delete(Number(id));
    return { success: true };
  },

  // ── Stats ───────────────────────────────────────────────
  async getStats() {
    const cards = await db.cards.toArray();

    const totalCards = cards.reduce((s, c) => s + (c.quantity || 1), 0);
    const totalValue = cards.reduce((s, c) => s + ((c.current_price || 0) * (c.quantity || 1)), 0);
    const totalCost  = cards.reduce((s, c) => s + ((c.purchase_price || 0) * (c.quantity || 1)), 0);
    const totalSets  = new Set(cards.filter(c => c.set_name).map(c => c.set_name)).size;

    const topCards = [...cards]
      .filter(c => c.current_price != null)
      .sort((a, b) => (b.current_price * (b.quantity || 1)) - (a.current_price * (a.quantity || 1)))
      .slice(0, 10);

    // Price history: group by day, sum latest price per card per day
    const allHistory = await db.price_history.toArray();
    const byDay = {};
    for (const h of allHistory) {
      const day = h.date?.slice(0, 10);
      if (!day) continue;
      if (!byDay[day]) byDay[day] = {};
      byDay[day][h.card_id] = h.price;
    }
    // For each day, sum (price * quantity) for all cards that had a price that day
    const cardMap = Object.fromEntries(cards.map(c => [c.id, c]));
    const priceHistory = Object.entries(byDay)
      .map(([day, cardPrices]) => ({
        day,
        total_value: Object.entries(cardPrices).reduce((sum, [cardId, price]) => {
          const card = cardMap[Number(cardId)];
          return sum + (price * (card?.quantity || 1));
        }, 0),
      }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-90);

    return { totalCards, totalValue, totalCost, totalSets, topCards, priceHistory };
  },

  async getSetsProgress() {
    const cards = await db.cards.toArray();
    const setsMap = {};
    for (const c of cards) {
      if (!c.set_name || !c.set_number) continue;
      if (!setsMap[c.set_name]) setsMap[c.set_name] = { set_name: c.set_name, set_id: c.set_id, numbers: new Set() };
      setsMap[c.set_name].numbers.add(c.set_number);
    }
    return Object.values(setsMap).map(s => ({
      set_name: s.set_name,
      set_id: s.set_id,
      owned_count: s.numbers.size,
      owned_numbers: [...s.numbers],
    }));
  },

  async getFilters() {
    const cards = await db.cards.toArray();
    const sets      = [...new Set(cards.map(c => c.set_name).filter(Boolean))].sort();
    const rarities  = [...new Set(cards.map(c => c.rarity).filter(Boolean))].sort();
    const languages = [...new Set(cards.map(c => c.language).filter(Boolean))].sort();
    const locations = [...new Set(cards.map(c => c.location).filter(Boolean))].sort();
    return { sets, rarities, languages, locations };
  },

  // ── PokémonTCG.io ───────────────────────────────────────
  async searchPokemon(q, page = 1) {
    return ptcgFetch(`/cards?q=name:${encodeURIComponent(q)}*&page=${page}&pageSize=20&orderBy=name`);
  },

  async getPokemonCard(id) {
    const data = await ptcgFetch(`/cards/${id}`);
    return data.data;
  },

  async getPokemonSets() {
    return ptcgFetch('/sets?orderBy=-releaseDate&pageSize=250');
  },

  async updatePrices() {
    const cards        = await db.cards.where('pokemontcg_id').above('').toArray();
    const wishlist     = await db.wishlist.where('pokemontcg_id').above('').toArray();
    let updated = 0, errors = 0;

    for (const card of cards) {
      try {
        const data = await ptcgFetch(`/cards/${card.pokemontcg_id}`);
        const cm = data.data?.cardmarket?.prices;
        if (!cm) continue;
        const price = cm.trendPrice ?? cm.averageSellPrice ?? cm.lowPrice;
        if (price == null) continue;
        await db.cards.update(card.id, { current_price: price });
        await db.price_history.add({
          card_id: card.id,
          price,
          trend_price: cm.trendPrice ?? null,
          avg_sell_price: cm.averageSellPrice ?? null,
          low_price: cm.lowPrice ?? null,
          date: now(),
        });
        updated++;
      } catch { errors++; }
    }

    for (const item of wishlist) {
      try {
        const data = await ptcgFetch(`/cards/${item.pokemontcg_id}`);
        const cm = data.data?.cardmarket?.prices;
        if (!cm) continue;
        const price = cm.trendPrice ?? cm.averageSellPrice ?? cm.lowPrice;
        if (price != null) await db.wishlist.update(item.id, { current_price: price });
      } catch { errors++; }
    }

    return { updated, errors, total: cards.length + wishlist.length };
  },
};
