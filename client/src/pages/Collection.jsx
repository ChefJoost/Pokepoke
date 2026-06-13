import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/index.js';

function formatPrice(v) {
  if (v == null) return null;
  return '€' + Number(v).toFixed(2);
}

const SORT_OPTIONS = [
  { value: 'created_at_DESC', label: 'Nieuwste eerst' },
  { value: 'current_price_DESC', label: 'Hoogste prijs' },
  { value: 'current_price_ASC', label: 'Laagste prijs' },
  { value: 'name_ASC', label: 'Naam A-Z' },
  { value: 'set_name_ASC', label: 'Set A-Z' },
];

export function Collection({ onCardClick }) {
  const [cards, setCards] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSet, setActiveSet] = useState('');
  const [activeRarity, setActiveRarity] = useState('');
  const [sort, setSort] = useState('created_at_DESC');

  const [sets, setSets] = useState([]);
  const [rarities, setRarities] = useState([]);

  useEffect(() => {
    api.getFilters().then(f => {
      setSets(f.sets || []);
      setRarities(f.rarities || []);
    }).catch(console.error);
  }, []);

  const loadCards = useCallback(() => {
    const [sortField, sortOrder] = sort.split('_');
    const params = { sort: sortField, order: sortOrder };
    if (search) params.search = search;
    if (activeSet) params.set_name = activeSet;
    if (activeRarity) params.rarity = activeRarity;
    setLoading(true);
    api.getCards(params).then(setCards).catch(console.error).finally(() => setLoading(false));
  }, [search, activeSet, activeRarity, sort]);

  useEffect(() => { loadCards(); }, [loadCards]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Collectie</h1>
        <span className="text-muted text-sm">{cards.length} kaarten</span>
      </div>

      <div className="search-bar">
        <span className="search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="search"
          placeholder="Zoek kaarten..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Set filter */}
      {sets.length > 0 && (
        <div className="filter-row">
          <button className={`filter-chip ${!activeSet ? 'active' : ''}`} onClick={() => setActiveSet('')}>Alle sets</button>
          {sets.map(s => (
            <button key={s} className={`filter-chip ${activeSet === s ? 'active' : ''}`} onClick={() => setActiveSet(activeSet === s ? '' : s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Rarity filter */}
      {rarities.length > 0 && (
        <div className="filter-row">
          <button className={`filter-chip ${!activeRarity ? 'active' : ''}`} onClick={() => setActiveRarity('')}>Alle rariteiten</button>
          {rarities.map(r => (
            <button key={r} className={`filter-chip ${activeRarity === r ? 'active' : ''}`} onClick={() => setActiveRarity(activeRarity === r ? '' : r)}>
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="flex-between mb-2" style={{ marginBottom: 12 }}>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ width: 'auto', fontSize: 13, padding: '6px 10px' }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? <div className="spinner" /> : (
        cards.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🃏</div>
            <h3>Geen kaarten gevonden</h3>
            <p>Probeer een andere zoekopdracht of voeg kaarten toe.</p>
          </div>
        ) : (
          <div className="pokemon-grid">
            {cards.map(card => (
              <div key={card.id} className="poke-card" onClick={() => onCardClick(card.id)}>
                {card.quantity > 1 && <div className="poke-card-qty">×{card.quantity}</div>}
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} loading="lazy" />
                ) : (
                  <div className="poke-card-placeholder">🃏</div>
                )}
                <div className="poke-card-info">
                  <div className="poke-card-name">{card.name}</div>
                  <div className="poke-card-set">{card.set_name || 'Onbekend'}</div>
                  {card.current_price != null && (
                    <div className="poke-card-price">{formatPrice(card.current_price)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
