import React, { useState, useEffect } from 'react';
import { assureurAPI } from '../../services/assureurAPI';

const STATUS_CONFIG = {
  soumis:       { label: 'Soumis',       color: '#00D4FF' },
  en_analyse:   { label: 'En analyse',   color: '#FFB347' },
  devis_genere: { label: 'Devis généré', color: '#A78BFA' },
  valide:       { label: 'Validé',       color: '#4DFFB4' },
  rejete:       { label: 'Rejeté',       color: '#FF4466' },
};

const RISK_COLOR = { Critique: '#FF4466', Élevé: '#FF8C42', Moyen: '#FFB347', Faible: '#4DFFB4', Minimal: '#00D4FF' };

export default function AssureurDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    assureurAPI.getDossiers()
      .then(r => setDossiers(r.data?.dossiers || r.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = dossiers
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => !search || d.company?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="as-page fade-in">
      {selected ? (
        <DossierDetail dossier={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className="as-toolbar">
            <div className="as-search-wrap">
              <i className="ti ti-search as-search-icon" aria-hidden="true" />
              <input
                className="as-search"
                placeholder="Rechercher une entreprise..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="as-filter-tabs">
              {['all', 'soumis', 'devis_genere', 'valide', 'rejete'].map(f => (
                <button
                  key={f}
                  className={`as-filter-tab ${filter === f ? 'as-filter-tab--active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Tous' : STATUS_CONFIG[f]?.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? <Loader /> : error ? (
            <div className="as-empty">
              <i className="ti ti-wifi-off" style={{ fontSize: 32 }} aria-hidden="true" />
              <span>Impossible de charger les dossiers</span>
            </div>
          ) : (
            <div className="as-panel">
              <div className="as-panel-header">
                <h2 className="as-panel-title">Dossiers <span className="as-count">{filtered.length}</span></h2>
              </div>
              <div className="as-table-wrap">
                <table className="as-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Entreprise</th>
                      <th>Secteur</th>
                      <th>Taille</th>
                      <th>Statut</th>
                      <th>Score</th>
                      <th>Risque</th>
                      <th>Soumis le</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => {
                      const sc = STATUS_CONFIG[d.status] || { label: d.status, color: '#888' };
                      const rc = RISK_COLOR[d.niveau_risque];
                      return (
                        <tr key={i} className="as-table-row--clickable" onClick={() => setSelected(d)}>
                          <td className="as-table-id">#{d.id}</td>
                          <td className="as-table-company">{d.company}</td>
                          <td className="as-table-dim">{d.secteur}</td>
                          <td className="as-table-dim">{d.taille}</td>
                          <td>
                            <span className="as-badge" style={{ color: sc.color, background: sc.color + '18' }}>
                              {sc.label}
                            </span>
                          </td>
                          <td>
                            {d.score != null ? (
                              <div className="as-score-cell">
                                <div className="as-score-mini-bar">
                                  <div style={{ width: `${d.score}%`, background: rc || '#4DFFB4', height: '100%', borderRadius: '2px', transition: 'width 0.5s' }} />
                                </div>
                                <span style={{ color: rc || '#4DFFB4', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{d.score}</span>
                              </div>
                            ) : <span className="as-score-dash">—</span>}
                          </td>
                          <td>
                            {d.niveau_risque ? (
                              <span className="as-badge" style={{ color: rc, background: rc + '18' }}>{d.niveau_risque}</span>
                            ) : <span className="as-score-dash">—</span>}
                          </td>
                          <td className="as-table-date">{d.date_soumission}</td>
                          <td>
                            <button className="as-view-btn">
                              <i className="ti ti-eye" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="as-empty">
                    <i className="ti ti-folder-off" aria-hidden="true" />
                    <span>Aucun dossier trouvé</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DossierDetail({ dossier, onBack }) {
  const [score, setScore] = useState(null);

  useEffect(() => {
    assureurAPI.getScore(dossier.id)
      .then(r => setScore(r.data))
      .catch(() => {});
  }, [dossier.id]);

  const rc = RISK_COLOR[score?.niveau_risque];

  return (
    <div className="as-detail fade-in">
      <button className="as-back-btn" onClick={onBack}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
        Retour aux dossiers
      </button>

      <div className="as-detail-header">
        <div>
          <h2 className="as-detail-title">{dossier.company}</h2>
          <div className="as-detail-meta">
            <span>{dossier.secteur}</span>
            <span className="as-meta-sep">·</span>
            <span>{dossier.taille}</span>
            <span className="as-meta-sep">·</span>
            <span>Dossier #{dossier.id}</span>
          </div>
        </div>
        <span className="as-badge as-badge--lg" style={{ color: STATUS_CONFIG[dossier.status]?.color, background: STATUS_CONFIG[dossier.status]?.color + '18' }}>
          {STATUS_CONFIG[dossier.status]?.label}
        </span>
      </div>

      {score && (
        <div className="as-score-breakdown">
          <div className="as-score-main">
            <div className="as-score-ring" style={{ '--score-color': rc }}>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={rc || '#4DFFB4'} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(score.score_global / 100) * 314} 314`}
                  transform="rotate(-90 60 60)" />
                <text x="60" y="56" textAnchor="middle" fill="white" fontSize="22" fontWeight="300" fontFamily="JetBrains Mono, monospace">{score.score_global?.toFixed(0)}</text>
                <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Space Grotesk, sans-serif">score global</text>
              </svg>
            </div>
            <div className="as-score-detail-rows">
              <ScoreRow label="Score questionnaire" value={score.score_questionnaire} color="#00D4FF" />
              <ScoreRow label="Score documents" value={score.score_document} color="#A78BFA" />
              <ScoreRow label="Niveau de risque" value={null} badge={score.niveau_risque} badgeColor={rc} />
            </div>
          </div>
        </div>
      )}

      <div className="as-detail-info-grid">
        <InfoCard title="Dates">
          <InfoRow label="Création" value={dossier.date_creation} />
          <InfoRow label="Soumission" value={dossier.date_soumission} />
        </InfoCard>
        <InfoCard title="Entreprise">
          <InfoRow label="Secteur" value={dossier.secteur} />
          <InfoRow label="Taille" value={dossier.taille} />
        </InfoCard>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, color, badge, badgeColor }) {
  return (
    <div className="as-score-row">
      <span className="as-score-row-label">{label}</span>
      {value != null ? (
        <div className="as-score-row-right">
          <div className="as-score-row-bar">
            <div style={{ width: `${value}%`, background: color, height: '100%', borderRadius: '2px' }} />
          </div>
          <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', minWidth: '40px', textAlign: 'right' }}>{value?.toFixed(1)}</span>
        </div>
      ) : (
        <span className="as-badge" style={{ color: badgeColor, background: badgeColor + '18' }}>{badge}</span>
      )}
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="as-info-card">
      <div className="as-info-card-title">{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="as-info-row">
      <span className="as-info-label">{label}</span>
      <span className="as-info-value">{value}</span>
    </div>
  );
}

function Loader() {
  return <div className="as-loader"><div className="as-spinner" /></div>;
}
