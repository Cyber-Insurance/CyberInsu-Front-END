import React from 'react';

const STATUS_LABELS = {
  draft: 'Brouillon', soumis: 'Soumis', en_analyse: 'En analyse',
  devis_genere: 'Devis généré', valide: 'Validé', rejete: 'Rejeté',
};

export default function CourtierStats({ stats }) {
  if (!stats) return null;

  const kpis = [
    { icon: 'ti ti-folder',        label: 'Dossiers total',  value: stats.total_dossiers,  color: '#4DFFB4' },
    { icon: 'ti ti-loader',        label: 'Dossiers actifs', value: stats.dossiers_actifs,  color: '#00D4FF' },
    { icon: 'ti ti-file-invoice',  label: 'Devis envoyés',   value: stats.devis_envoyes,    color: '#A78BFA' },
    { icon: 'ti ti-users',         label: 'Clients actifs',  value: stats.clients_actifs,   color: '#FFB347' },
  ];

  return (
    <>
      {/* KPI cards */}
      <div className="co-kpi-grid">
        {kpis.map((k) => (
          <div className="co-kpi-card" key={k.label} style={{ '--kpi-color': k.color }}>
            <div className="co-kpi-top">
              <i className={k.icon} style={{ color: k.color }} />
              <span className="co-kpi-label">{k.label}</span>
            </div>
            <div className="co-kpi-value">{k.value}</div>
            <div className="co-kpi-bar">
              <div className="co-kpi-bar-fill" style={{ width: '100%' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="co-two-col">
        {/* Score moyen */}
        <div className="co-panel">
          <div className="co-panel-header">
            <span className="co-panel-title">Score moyen portefeuille</span>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 56, fontWeight: 300, color: '#4DFFB4', lineHeight: 1, marginBottom: 16, letterSpacing: '-0.02em' }}>
              {stats.score_moyen}
            </div>
            <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stats.score_moyen}%`, background: '#4DFFB4', borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Répartition */}
        <div className="co-panel">
          <div className="co-panel-header">
            <span className="co-panel-title">Répartition par statut</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(stats.repartition || {}).map(([k, v]) => (
              <div key={k} className="co-rep-row">
                <span className="co-rep-label">
                  <span className="co-rep-dot" />
                  {STATUS_LABELS[k] || k}
                </span>
                <div className="co-rep-bar-wrap">
                  <div className="co-rep-bar">
                    <div
                      className="co-rep-fill"
                      style={{ width: stats.total_dossiers ? `${(v / stats.total_dossiers) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <span className="co-rep-pct"
                  style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--c-text2)' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dossiers récents */}
      <div className="co-panel">
        <div className="co-panel-header">
          <span className="co-panel-title">Dossiers récents</span>
        </div>
        <div className="co-table-wrap">
          <table className="co-table">
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Statut</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recent_dossiers || []).map((d) => (
                <tr key={d.id}>
                  <td className="co-td-company">{d.company}</td>
                  <td>
                    <span className={`co-badge co-badge--${d.status}`}>
                      {STATUS_LABELS[d.status] || d.status}
                    </span>
                  </td>
                  <td>
                    {d.score != null ? (
                      <div className="co-score-cell">
                        <div className="co-score-mini-bar">
                          <div className="co-score-fill" style={{ width: `${d.score}%`, background: '#4DFFB4' }} />
                        </div>
                        <span className="co-score-num">{d.score}</span>
                      </div>
                    ) : <span style={{ color: 'var(--c-text3)', fontFamily: 'var(--f-mono)' }}>—</span>}
                  </td>
                  <td className="co-td-date">{d.date_creation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!stats.recent_dossiers || stats.recent_dossiers.length === 0) && (
          <div className="co-empty"><i className="ti ti-folder-off" /><p>Aucun dossier récent</p></div>
        )}
      </div>
    </>
  );
}
