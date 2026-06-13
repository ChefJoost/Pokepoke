import { useEffect, useState } from 'react';
import { api } from '../api/index.js';

function formatPrice(v) {
  if (v == null) return '—';
  return '€' + Number(v).toFixed(2);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-NL');
}

const CARDMARKET_URL = (card) => {
  if (!card.set_name || !card.name) return null;
  const setSlug = encodeURIComponent(card.set_name.replace(/\s+/g, '-'));
  const nameSlug = encodeURIComponent(card.name.replace(/\s+/g, '-'));
  return `https://www.cardmarket.com/nl/Pokemon/Products/Singles/${setSlug}/${nameSlug}`;
};

export function CardDetail({ cardId, onEdit, onBack, onDelete, toast }) {
  const [card, setCard] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!cardId) return;
    Promise.all([
      api.getCard(cardId),
      api.getCardPriceHistory(cardId)
    ]).then(([c, h]) => {
      setCard(c);
      setHistory(h);
    }).catch(() => toast('Fout bij laden', 'error')).finally(() => setLoading(false));
  }, [cardId]);

  async function handleDelete() {
    try {
      await api.deleteCard(cardId);
      toast('Kaart verwijderd');
      onDelete();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (loading) return <div className="spinner" />;
  if (!card) return <div className="empty-state"><p>Kaart niet gevonden</p></div>;

  const profit = card.current_price != null && card.purchase_price != null
    ? (card.current_price - card.purchase_price) * card.quantity
    : null;
  const cardmarketUrl = CARDMARKET_URL(card);

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Terug</button>
        <button className="btn btn-primary btn-sm" onClick={() => onEdit(card.id)}>Bewerken</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} className="detail-card-img" />
        ) : (
          <div style={{ fontSize: 64, marginBottom: 16 }}>🃏</div>
        )}
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{card.name}</h2>
        {card.set_name && <p className="text-muted">{card.set_name} {card.set_number && `· #${card.set_number}`}</p>}
        {card.is_graded && card.grade && (
          <div style={{ marginTop: 6 }}>
            <span style={{ background: 'var(--accent)', color: '#1a1a2e', padding: '3px 10px', borderRadius: 20, fontWeight: 800, fontSize: 13 }}>
              {card.grading_company} {card.grade}
            </span>
          </div>
        )}
      </div>

      {/* Price summary */}
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value">{formatPrice(card.current_price)}</div>
          <div className="stat-label">Huidig</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatPrice(card.purchase_price)}</div>
          <div className="stat-label">Aankoop</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{card.quantity}</div>
          <div className="stat-label">Aantal</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: profit != null ? (profit >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--accent)', fontSize: 18 }}>
            {profit != null ? `${profit >= 0 ? '+' : ''}${formatPrice(profit)}` : '—'}
          </div>
          <div className="stat-label">W/V</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Conditie</div>
              <div className="detail-item-value">{card.condition || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Taal</div>
              <div className="detail-item-value">{card.language || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Rariteit</div>
              <div className="detail-item-value">{card.rarity || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Locatie</div>
              <div className="detail-item-value">{card.location || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Aankoopbron</div>
              <div className="detail-item-value">{card.purchase_source || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Aankoopdatum</div>
              <div className="detail-item-value">{formatDate(card.purchase_date)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Toegevoegd</div>
              <div className="detail-item-value">{formatDate(card.created_at)}</div>
            </div>
          </div>

          {card.tags && card.tags.length > 0 && (
            <div className="mt-2">
              <div className="detail-item-label mb-1">Tags</div>
              <div className="tags-container">
                {card.tags.map(t => <span key={t} className="tag-chip active">{t}</span>)}
              </div>
            </div>
          )}

          {card.notes && (
            <div className="mt-2">
              <div className="detail-item-label mb-1">Notities</div>
              <p className="text-sm">{card.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cardmarket link */}
      {cardmarketUrl && (
        <a href={cardmarketUrl} target="_blank" rel="noopener noreferrer"
          className="btn btn-ghost btn-block" style={{ marginBottom: 12 }}>
          🛒 Bekijk op Cardmarket
        </a>
      )}

      {/* Price history */}
      {history.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-header">Prijsgeschiedenis</div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {history.slice(0, 20).map(h => (
              <div key={h.id} className="list-item" style={{ cursor: 'default' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{formatPrice(h.price)}</div>
                  <div className="text-xs text-muted">{new Date(h.date).toLocaleDateString('nl-NL')}</div>
                </div>
                {h.trend_price && <div className="text-xs text-muted">Trend: {formatPrice(h.trend_price)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      <div style={{ marginBottom: 20 }}>
        {!confirmDelete ? (
          <button className="btn btn-ghost btn-block" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
            onClick={() => setConfirmDelete(true)}>
            Kaart verwijderen
          </button>
        ) : (
          <div className="card card-body" style={{ background: 'rgba(248,113,113,0.1)', borderColor: 'var(--red)' }}>
            <p className="text-sm" style={{ marginBottom: 10 }}>Weet je zeker dat je "{card.name}" wilt verwijderen?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Annuleren</button>
              <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={handleDelete}>Verwijderen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
