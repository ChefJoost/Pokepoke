const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Cards
  getCards: (params = {}) => req('GET', `/cards?${new URLSearchParams(params)}`),
  getCard: (id) => req('GET', `/cards/${id}`),
  createCard: (data) => req('POST', '/cards', data),
  updateCard: (id, data) => req('PUT', `/cards/${id}`, data),
  deleteCard: (id) => req('DELETE', `/cards/${id}`),
  getCardPriceHistory: (id) => req('GET', `/cards/${id}/price-history`),

  // Wishlist
  getWishlist: () => req('GET', '/wishlist'),
  getWishlistItem: (id) => req('GET', `/wishlist/${id}`),
  createWishlistItem: (data) => req('POST', '/wishlist', data),
  updateWishlistItem: (id, data) => req('PUT', `/wishlist/${id}`, data),
  deleteWishlistItem: (id) => req('DELETE', `/wishlist/${id}`),

  // Stats
  getStats: () => req('GET', '/stats'),
  getSetsProgress: () => req('GET', '/stats/sets'),
  getFilters: () => req('GET', '/stats/filters'),

  // PokémonTCG
  searchPokemon: (q, page = 1) => req('GET', `/pokemon/search?q=${encodeURIComponent(q)}&page=${page}`),
  getPokemonCard: (id) => req('GET', `/pokemon/card/${id}`),
  getPokemonSets: () => req('GET', '/pokemon/sets'),
  updatePrices: () => req('POST', '/pokemon/update-prices', {}),
};
