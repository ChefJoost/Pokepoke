import { useState, useEffect, useRef } from 'react';
import { api } from '../api/index.js';

const CONDITIONS = ['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'P'];
const LANGUAGES = ['NL', 'EN', 'DE', 'FR', 'IT', 'ES', 'JP', 'KO', 'PT', 'ZH'];
const TAGS = ['investering', 'playset', 'ruil', 'favoriet', 'display'];
const GRADING_COMPANIES = ['PSA', 'BGS', 'CGC', 'SGC', 'ACE'];

const EMPTY = {
  name: '', set_name: '', set_id: '', set_number: '', rarity: '',
  language: 'EN', condition: 'NM', is_graded: false, grade: '', grading_company: '',
  quantity: 1, location: '', purchase_price: '', purchase_date: '', purchase_source: '',
  pokemontcg_id: '', image_url: '', tags: [], notes: '', current_price: ''
};

export function CardForm({ cardId, onSaved, onCancel, toast }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!cardId);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (cardId) {
      api.getCard(cardId).then(card => {
        setForm({ ...EMPTY, ...card, grade: card.grade ?? '', purchase_price: card.purchase_price ?? '', current_price: card.current_price ?? '' });
      }).catch(() => toast('Fout bij laden kaart', 'error')).finally(() => setLoading(false));
    }
  }, [cardId]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }));
  }

  async function doSearch(q) {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await api.searchPokemon(q);
      setSearchResults(data.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }

  function onSearchChange(e) {
    const q = e.target.value;
    setSearchQ(q);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(q), 400);
  }

  function selectPokemonCard(ptcgCard) {
    const cm = ptcgCard.cardmarket?.prices;
    setForm(f => ({
      ...f,
      name: ptcgCard.name,
      set_name: ptcgCard.set?.name || '',
      set_id: ptcgCard.set?.id || '',
      set_number: ptcgCard.number || '',
      rarity: ptcgCard.rarity || '',
      pokemontcg_id: ptcgCard.id,
      image_url: ptcgCard.images?.small || '',
      current_price: cm?.trendPrice ?? cm?.averageSellPrice ?? ''
    }));
    setShowSearch(false);
    setSearchQ('');
    setSearchResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast('Naam is verplicht', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 1,
        purchase_price: form.purchase_price !== '' ? Number(form.purchase_price) : null,
        current_price: form.current_price !== '' ? Number(form.current_price) : null,
        grade: form.grade !== '' ? Number(form.grade) : null,
      };
      if (cardId) {
        await api.updateCard(cardId, payload);
        toast('Kaart bijgewerkt!');
      } else {
        await api.createCard(payload);
        toast('Kaart toegevoegd!');
      }
      onSaved();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner" />;

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>← Terug</button>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{cardId ? 'Bewerken' : 'Kaart toevoegen'}</h2>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? '...' : 'Opslaan'}
        </button>
      </div>

      {/* PokémonTCG search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <label>Zoek op PokémonTCG.io</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Typ kaartnaam om te zoeken..."
              value={searchQ}
              onChange={onSearchChange}
              onFocus={() => setShowSearch(true)}
            />
            {searching && <div style={{ position: 'absolute', right: 10, top: 10 }}>⟳</div>}
          </div>

          {showSearch && searchResults.length > 0 && (
            <div style={{
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              marginTop: 4, maxHeight: 280, overflowY: 'auto', background: 'var(--bg)'
            }}>
              {searchResults.map(c => (
                <div key={c.id} className="list-item" onClick={() => selectPokemonCard(c)}
                  style={{ padding: '8px 12px' }}>
                  {c.images?.small && <img src={c.images.small} alt={c.name} style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.set?.name} · #{c.number} · {c.rarity}</div>
                  </div>
                  {c.cardmarket?.prices?.trendPrice && (
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
                      €{c.cardmarket.prices.trendPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showSearch && searchResults.length === 0 && searchQ && !searching && (
            <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--text2)' }}>Geen resultaten gevonden</div>
          )}
        </div>
      </div>

      {/* Card image preview */}
      {form.image_url && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src={form.image_url} alt={form.name} style={{ maxWidth: 160, borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)' }} />
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Kaartinfo</div>
        <div className="card-body">
          <div className="form-group">
            <label>Naam *</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Bijv. Charizard" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Set</label>
              <input type="text" value={form.set_name} onChange={e => set('set_name', e.target.value)} placeholder="Base Set" />
            </div>
            <div className="form-group">
              <label>Nummer</label>
              <input type="text" value={form.set_number} onChange={e => set('set_number', e.target.value)} placeholder="4/102" />
            </div>
          </div>
          <div className="form-group">
            <label>Rariteit</label>
            <input type="text" value={form.rarity} onChange={e => set('rarity', e.target.value)} placeholder="Rare Holo" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Taal</label>
              <select value={form.language} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Conditie</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value)}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Grading</div>
        <div className="card-body">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_graded} onChange={e => set('is_graded', e.target.checked)} style={{ width: 18 }} />
              Kaart is gegraad
            </label>
          </div>
          {form.is_graded && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>Grade</label>
                <input type="number" step="0.5" min="1" max="10" value={form.grade} onChange={e => set('grade', e.target.value)} placeholder="9.5" />
              </div>
              <div className="form-group">
                <label>Bedrijf</label>
                <select value={form.grading_company} onChange={e => set('grading_company', e.target.value)}>
                  <option value="">Kies...</option>
                  {GRADING_COMPANIES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Collectie details</div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Aantal</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Locatie</label>
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Map A" />
            </div>
          </div>
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-container">
              {TAGS.map(tag => (
                <button key={tag} type="button" className={`tag-chip ${form.tags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Aankoop</div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Aankoopprijs (€)</label>
              <input type="number" step="0.01" min="0" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>Datum</label>
              <input type="date" value={form.purchase_date || ''} onChange={e => set('purchase_date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Bron</label>
            <input type="text" value={form.purchase_source} onChange={e => set('purchase_source', e.target.value)} placeholder="eBay, cardmarket, ..." />
          </div>
          <div className="form-group">
            <label>Huidige waarde (€)</label>
            <input type="number" step="0.01" min="0" value={form.current_price} onChange={e => set('current_price', e.target.value)} placeholder="Auto via API" />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Notities</div>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Aanvullende info..." rows={3} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Annuleren</button>
        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
          {saving ? 'Opslaan...' : (cardId ? 'Opslaan' : 'Kaart toevoegen')}
        </button>
      </div>
    </form>
  );
}
