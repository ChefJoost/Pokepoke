import { useEffect, useState } from 'react';
import { api } from '../api/index.js';

export function Sets() {
  const [owned, setOwned] = useState([]);
  const [allSets, setAllSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [apiSetsLoading, setApiSetsLoading] = useState(false);

  useEffect(() => {
    api.getSetsProgress().then(setOwned).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function loadApiSets() {
    if (allSets.length) return;
    setApiSetsLoading(true);
    try {
      const data = await api.getPokemonSets();
      setAllSets(data.data || []);
    } catch { }
    setApiSetsLoading(false);
  }

  function getApiSet(setId) {
    return allSets.find(s => s.id === setId);
  }

  function getProgress(set) {
    const apiSet = getApiSet(set.set_id);
    if (!apiSet) return null;
    const total = apiSet.printedTotal || apiSet.total;
    return { owned: set.owned_count, total, pct: Math.round((set.owned_count / total) * 100) };
  }

  function toggleExpand(name) {
    setExpanded(e => e === name ? null : name);
    loadApiSets();
  }

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sets</h1>
        <span className="text-muted text-sm">{owned.length} sets</span>
      </div>

      {owned.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📦</div>
          <h3>Geen sets gevonden</h3>
          <p>Voeg kaarten toe met een set-naam om hier voortgang te zien.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {owned.map(set => {
            const progress = getProgress(set);
            const isExpanded = expanded === set.set_name;
            const apiSet = getApiSet(set.set_id);
            const total = apiSet?.printedTotal || apiSet?.total || '?';
            const missing = apiSet ? getMissing(set.owned_numbers, apiSet.printedTotal || apiSet.total) : [];

            return (
              <div key={set.set_name} className="card">
                <div className="list-item" onClick={() => toggleExpand(set.set_name)} style={{ borderBottom: isExpanded ? '1px solid var(--border)' : 'none' }}>
                  {apiSet?.images?.symbol && (
                    <img src={apiSet.images.symbol} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{set.set_name}</div>
                    <div className="text-xs text-muted">{set.owned_count} / {total} kaarten</div>
                    <div className="progress-bar" style={{ marginTop: 6 }}>
                      <div className="progress-fill" style={{ width: progress ? `${progress.pct}%` : '0%' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--text2)' }}>{isExpanded ? '▲' : '▼'}</div>
                </div>

                {isExpanded && (
                  <div className="card-body">
                    {apiSetsLoading ? (
                      <div className="spinner" style={{ margin: '10px auto', width: 24, height: 24 }} />
                    ) : (
                      <>
                        <div className="text-sm text-muted mb-1" style={{ marginBottom: 8 }}>
                          {progress ? `${progress.pct}% compleet · ${missing.length} nog nodig` : `${set.owned_count} kaarten`}
                        </div>
                        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>In bezit:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                          {set.owned_numbers.sort(numSort).map(n => (
                            <span key={n} style={{ background: 'var(--primary)', color: 'white', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                              {n}
                            </span>
                          ))}
                        </div>
                        {missing.length > 0 && (
                          <>
                            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13, color: 'var(--red)' }}>
                              Ontbrekend ({missing.length}):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {missing.sort(numSort).map(n => (
                                <span key={n} style={{ background: 'var(--surface2)', color: 'var(--text2)', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                                  {n}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getMissing(owned, total) {
  if (!total) return [];
  const ownedSet = new Set(owned.map(String));
  const missing = [];
  for (let i = 1; i <= total; i++) {
    if (!ownedSet.has(String(i))) missing.push(String(i));
  }
  return missing;
}

function numSort(a, b) {
  return parseInt(a) - parseInt(b);
}
