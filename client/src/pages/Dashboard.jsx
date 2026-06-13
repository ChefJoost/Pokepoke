import { useEffect, useState } from 'react';
import { api } from '../api/index.js';

function formatPrice(v) {
  if (v == null) return '—';
  return '€' + Number(v).toFixed(2);
}

function MiniLineChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 13 }}>
        Niet genoeg data voor grafiek
      </div>
    );
  }

  const values = data.map(d => d.total_value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 300, H = 150, PAD = 10;

  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.total_value - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = [
    `${PAD},${H - PAD}`,
    ...data.map((d, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((d.total_value - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    }),
    `${W - PAD},${H - PAD}`,
  ].join(' ');

  const first = data[0];
  const last = data[data.length - 1];
  const change = last.total_value - first.total_value;
  const changePct = ((change / first.total_value) * 100).toFixed(1);
  const isUp = change >= 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--text2)' }}>Afgelopen {data.length} dagen</span>
        <span style={{ color: isUp ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
          {isUp ? '+' : ''}{formatPrice(change)} ({isUp ? '+' : ''}{changePct}%)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160, overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#6c63ff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#chartGrad)" />
        <polyline points={points} fill="none" stroke="#6c63ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Last point dot */}
        {(() => {
          const lastX = PAD + ((data.length - 1) / (data.length - 1)) * (W - PAD * 2);
          const lastY = H - PAD - ((last.total_value - min) / range) * (H - PAD * 2);
          return <circle cx={lastX} cy={lastY} r="4" fill="#6c63ff" />;
        })()}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
        <span>{first.day}</span>
        <span>{last.day}</span>
      </div>
    </div>
  );
}

export function Dashboard({ setPage, setEditCard }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleUpdatePrices() {
    setUpdating(true);
    setUpdateResult(null);
    try {
      const result = await api.updatePrices();
      setUpdateResult(result);
      const fresh = await api.getStats();
      setStats(fresh);
    } catch (err) {
      setUpdateResult({ error: err.message });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="spinner" />;

  const profit = stats ? stats.totalValue - stats.totalCost : 0;
  const isProfit = profit >= 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">PokePoke</h1>
        <button
          className="btn btn-accent btn-sm"
          onClick={handleUpdatePrices}
          disabled={updating}
        >
          {updating ? '⟳ Laden...' : '↑ Prijzen'}
        </button>
      </div>

      {updateResult && (
        <div className="card card-body mb-2" style={{ marginBottom: 12 }}>
          {updateResult.error ? (
            <span className="text-sm" style={{ color: 'var(--red)' }}>Fout: {updateResult.error}</span>
          ) : (
            <span className="text-sm" style={{ color: 'var(--green)' }}>
              ✓ {updateResult.updated} van {updateResult.total} kaarten bijgewerkt
            </span>
          )}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{formatPrice(stats?.totalValue)}</div>
          <div className="stat-label">Collectiewaarde</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalCards ?? 0}</div>
          <div className="stat-label">Kaarten</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalSets ?? 0}</div>
          <div className="stat-label">Sets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: isProfit ? 'var(--green)' : 'var(--red)', fontSize: 20 }}>
            {isProfit ? '+' : ''}{formatPrice(profit)}
          </div>
          <div className="stat-label">Winst/Verlies</div>
        </div>
      </div>

      <div className="card mb-2" style={{ marginBottom: 16 }}>
        <div className="card-header">Waardeverloop</div>
        <div className="card-body">
          <MiniLineChart data={stats?.priceHistory} />
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <span>Top 10 waardevolste kaarten</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('collection')}>Alles</button>
        </div>
        {!stats?.topCards?.length ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="emoji">🃏</div>
            <p>Nog geen kaarten met prijzen</p>
            <button className="btn btn-primary btn-sm mt-2" style={{ marginTop: 12 }} onClick={() => setPage('add')}>
              Kaart toevoegen
            </button>
          </div>
        ) : (
          stats.topCards.map(card => (
            <div
              key={card.id}
              className="list-item"
              onClick={() => { setEditCard({ id: card.id, mode: 'view' }); setPage('card-detail'); }}
            >
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="list-item-img" />
              ) : (
                <div className="list-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🃏</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{card.name}</div>
                <div className="text-sm text-muted">{card.set_name}</div>
                {card.quantity > 1 && <div className="text-xs text-muted">×{card.quantity}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatPrice(card.current_price)}</div>
                {card.quantity > 1 && (
                  <div className="text-xs text-muted">totaal: {formatPrice(card.current_price * card.quantity)}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
