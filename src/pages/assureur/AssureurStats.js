import React, { useState, useEffect } from 'react';
import { assureurAPI } from '../../services/assureurAPI';

const STATUS_CONFIG = {
  soumis:         { label: 'Soumis',         color: '#00D4FF', bg: 'rgba(0,212,255,0.1)' },
  en_analyse:     { label: 'En analyse',     color: '#FFB347', bg: 'rgba(255,179,71,0.1)' },
  devis_genere:   { label: 'Devis généré',   color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  valide:         { label: 'Validé',         color: '#4DFFB4', bg: 'rgba(77,255,180,0.1)' },
  rejete:         { label: 'Rejeté',         color: '#FF4466', bg: 'rgba(255,68,102,0.1)' },
};

const RISK_CONFIG = [
  { label: 'Critique', range: [0, 30],   color: '#FF4466' },
  { label: 'Élevé',    range: [30, 50],  color: '#FF8C42' },
  { label: 'Moyen',    range: [50, 70],  color: '#FFB347' },
  { label: 'Faible',   range: [70, 85],  color: '#4DFFB4' },
  { label: 'Minimal',  range: [85, 100], color: '#00D4FF' },
];

function getRiskLevel(score) {
  return RISK_CONFIG.find(r => score >= r.range[0] && score < r.range[1]) || RISK_CONFIG[0];
}

export default function AssureurStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    assureurAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const CARDS = [
    { label: 'Dossiers reçus',  value: stats?.total_dossiers ?? 0, color: '#00D4FF', icon: 'ti-folder' },
    { label: 'À valider',       value: stats?.a_valider ?? 0,      color: '#FFB347', icon: 'ti-clock' },
    { label: 'Validés',         value: stats?.valides ?? 0,        color: '#4DFFB4', icon: 'ti-circle-check' },
    { label: 'Rejetés',         value: stats?.rejetes ?? 0,        color: '#FF4466', icon: 'ti-circle-x' },
  ];

  if (loading) return <Loader />;
  if (error) return (
    <div className="as-page fade-in">
      <div className="as-empty">
        <i className="ti ti-wifi-off" style={{ fontSize: 32 }} aria-hidden="true" />
        <span>Impossible de charger les statistiques</span>
      </div>
    </div>
  );

  return (
    <div className="as-page fade-in">
      {/* KPI Cards */}
      <div className="as-kpi-grid">
        {CARDS.map((c, i) => (
          <div key={i} className="as-kpi-card" style={{ '--kpi-color': c.color }}>
            <div className="as-kpi-top">
              <i className={`ti ${c.icon}`} style={{ color: c.color }} aria-hidden="true" />
              <span className="as-kpi-label">{c.label}</span>
            </div>
            <div className="as-kpi-value">{c.value}</div>
            <div className="as-kpi-bar"><div className="as-kpi-bar-fill" /></div>
          </div>
        ))}
      </div>

      <div className="as-two-col">
        {/* Score moyen */}
        <div className="as-panel">
          <div className="as-panel-header">
            <h2 className="as-panel-title">Score moyen du portefeuille</h2>
          </div>
          <div className="as-score-display">
            <div className="as-score-gauge">
              <svg viewBox="0 0 200 110" width="200" height="110">
                <defs>
                  <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#FF4466" />
                    <stop offset="40%"  stopColor="#FFB347" />
                    <stop offset="70%"  stopColor="#4DFFB4" />
                    <stop offset="100%" stopColor="#00D4FF" />
                  </linearGradient>
                </defs>
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none" stroke="url(#gauge-grad)" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${((stats?.score_moyen ?? 0) / 100) * 251} 251`}
                />
                <text x="100" y="88" textAnchor="middle" fill="white" fontSize="28" fontWeight="300" fontFamily="JetBrains Mono, monospace">
                  {stats?.score_moyen != null ? stats.score_moyen.toFixed(1) : '—'}
                </text>
                <text x="100" y="104" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Space Grotesk, sans-serif">
                  /100
                </text>
              </svg>
            </div>
            <div className="as-risk-legend">
              {RISK_CONFIG.map(r => (
                <div key={r.label} className="as-risk-item">
                  <span className="as-risk-dot" style={{ background: r.color }} />
                  <span className="as-risk-label">{r.label}</span>
                  <span className="as-risk-range">{r.range[0]}–{r.range[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Répartition */}
        <div className="as-panel">
          <div className="as-panel-header">
            <h2 className="as-panel-title">Répartition des statuts</h2>
          </div>
          <div className="as-repartition">
            {[
              { label: 'Soumis',       v: (stats?.total_dossiers ?? 0) - (stats?.a_valider ?? 0) - (stats?.valides ?? 0) - (stats?.rejetes ?? 0), color: '#00D4FF' },
              { label: 'À valider',    v: stats?.a_valider ?? 0, color: '#FFB347' },
              { label: 'Validés',      v: stats?.valides ?? 0,   color: '#4DFFB4' },
              { label: 'Rejetés',      v: stats?.rejetes ?? 0,   color: '#FF4466' },
            ].map((item, i) => {
              const pct = (stats?.total_dossiers ?? 0) > 0 ? (item.v / stats.total_dossiers * 100).toFixed(1) : 0;
              return (
                <div key={i} className="as-rep-row">
                  <div className="as-rep-label">
                    <span className="as-rep-dot" style={{ background: item.color }} />
                    <span>{item.label}</span>
                  </div>
                  <div className="as-rep-bar-wrap">
                    <div className="as-rep-bar">
                      <div className="as-rep-fill" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                  <span className="as-rep-pct" style={{ color: item.color }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent dossiers */}
      <div className="as-panel">
        <div className="as-panel-header">
          <h2 className="as-panel-title">Activité récente</h2>
        </div>
        <div className="as-table-wrap">
          <table className="as-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Entreprise</th>
                <th>Statut</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_dossiers?.map((d, i) => {
                const sc = STATUS_CONFIG[d.status] || { label: d.status, color: '#888', bg: 'rgba(136,136,136,0.1)' };
                const risk = d.score ? getRiskLevel(d.score) : null;
                return (
                  <tr key={i}>
                    <td className="as-table-id">#{d.id}</td>
                    <td className="as-table-company">{d.company}</td>
                    <td>
                      <span className="as-badge" style={{ color: sc.color, background: sc.bg }}>
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      {d.score ? (
                        <span className="as-score-pill" style={{ color: risk?.color, background: risk?.color + '18' }}>
                          {d.score}/100
                        </span>
                      ) : (
                        <span className="as-score-dash">—</span>
                      )}
                    </td>
                    <td className="as-table-date">{d.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="as-loader">
      <div className="as-spinner" />
    </div>
  );
}
