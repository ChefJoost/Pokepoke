import { useEffect, useState, useRef } from 'react';
import { api } from '../api/index.js';

function formatPrice(v) {
  if (v == null) return null;
  return '€' + Number(v).toFixed(2);
}

const EMPTY = {
  name: '', set_name: '', set_id: '', set_number: '', rarity: '',
  language: 'EN', condition: 'NM', max_price: '', pokemontcg_id: '', image_url: '', notes: ''
};

export function Wishlist({ toast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    api.getWishlist().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  function openForm(item = null) {
    setEditItem(item);
    setForm(item ? { ...EMPTY, ...item, max_price: item.max_price ?? '' } : EMPTY);
    setShowForm(true);
    setSearchQ('');
    setSearchResults([]);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
  }

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
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

  function selectCard(c) {
    setForm(f => ({
      ...f,
      name: c.name,
      set_name: c.set?.name || '',
      set_id: c.set?.id || '',
      set_number: c.number || '',
      rarity: c.rarity || '',
      pokemontcg_id: c.id,
      image_url: c.images?.small || '',
    }));
    setSearchQ('');
    setSearchResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast('Naam is verplicht', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, max_price: form.max_price !== '' ? Number(form.max_price) : null };
      if (editItem) {
        const updated = await api.updateWishlistItem(editItem.id, payload);
        setItems(prev => prev.map(i => i.id === editItem.id ? updated : i));
        toast('Wishlist item bijgewerkt!');
      } else {
        const created = await api.createWishlistItem(payload);
        setItems(prev => [created, ...prev]);
        toast('Toegevoegd aan wishlist!');
      }
      closeForm();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteWishlistItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast('Verwijderd van wishlist');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (loading) return <div className="spinner" />;

  if (showForm) {
    return (
      <form onSubmit={handleSubmit}>
        <div className="page-header">
          <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}>← Terug</button>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editItem ? 'Bewerken' : 'Toevoegen'}</h2>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '...' : 'Opslaan'}</button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <label>Zoek op PokémonTCG.io</label>
            <input type="text" placeholder="Typ kaartnaam..." value={searchQ} onChange={onSearchChange} />
            {searching && <div style={{ padding: '6px 0', color: 'var(--text2)', fontSize: 13 }}>Zoeken...</div>}
            {searchResults.length > 0 && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: 4, maxHeight: 240, overflowY: 'auto', background: 'var(--bg)' }}>
                {searchResults.map(c => (
                  <div key={c.id} className="list-item" onClick={() => selectCard(c)} style={{ padding: '8px 12px' }}>
                    {c.images?.small && <img src={c.images.small} alt={c.name} style={{ width: 30, height: 42, objectFit: 'cover', borderRadius: 3 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.set?.name} · {c.rarity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {form.image_url && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src={form.image_url} alt={form.name} style={{ maxWidth: 120, borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }} />
          </div>
        )}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="form-group">
              <label>Naam *</label>
              <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>Set</label>
                <input type="text" value={form.set_name} onChange={e => setField('set_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Max prijs (€)</label>
                <input type="number" step="0.01" min="0" value={form.max_price} onChange={e => setField('max_price', e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notities</label>
              <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={closeForm}>Annuleren</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>{saving ? '...' : 'Opslaan'}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Wishlist</h1>
        <button className="btn btn-primary btn-sm" onClick={() => openForm()}>+ Toevoegen</button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">❤️</div>
          <h3>Wishlist is leeg</h3>
          <p>Voeg kaarten toe die je wilt hebben.</p>
          <button className="btn btn-primary mt-2" style={{ marginTop: 12 }} onClick={() => openForm()}>+ Toevoegen</button>
        </div>
      ) : (
        <div className="pokemon-grid">
          {items.map(item => (
            <div key={item.id} className="poke-card" onClick={() => openForm(item)}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} loading="lazy" />
              ) : (
                <div className="poke-card-placeholder">❤️</div>
              )}
              <div className="poke-card-info">
                <div className="poke-card-name">{item.name}</div>
                <div className="poke-card-set">{item.set_name || '—'}</div>
                {item.current_price != null && (
                  <div className="poke-card-price">{formatPrice(item.current_price)}</div>
                )}
                {item.max_price != null && (
                  <div style={{ fontSize: 10, color: item.current_price <= item.max_price ? 'var(--green)' : 'var(--red)' }}>
                    Max: {formatPrice(item.max_price)}
                    {item.current_price != null && (item.current_price <= item.max_price ? ' ✓' : ' ✗')}
                  </div>
                )}
              </div>
              <button
                className="btn btn-sm"
                style={{ position: 'absolute', top: 6, left: 6, padding: '2px 6px', background: 'rgba(248,113,113,0.9)', color: 'white', borderRadius: 6, fontSize: 12 }}
                onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
