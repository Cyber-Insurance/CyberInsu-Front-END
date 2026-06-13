import React from 'react';

const STATUS_LABELS = {
  draft: 'Brouillon', soumis: 'Soumis', en_analyse: 'En analyse',
  devis_genere: 'Devis généré', valide: 'Validé', rejete: 'Rejeté',
};

const RISK_COLORS = {
  Minimal: '#4DFFB4', Faible: '#34d399', Moyen: '#FFB347',
  'Élevé': '#fb923c', Critique: '#FF4466',
};

export default function ClientOverview({ dossier, onNavigate }) {
  if (!dossier) return null;

  const steps = [
    { key: 'questionnaire', label: 'Questionnaire', icon: 'ti ti-clipboard-list', sub: 'Évaluation des risques', done: dossier.questionnaire_complete },
    { key: 'documents',     label: 'Documents',     icon: 'ti ti-file-upload',    sub: `${dossier.documents_count} fichier(s)`,  done: dossier.documents_count > 0 },
    { key: 'devis',         label: 'Devis',         icon: 'ti ti-file-invoice',   sub: 'Proposition tarifaire', done: !!dossier.devis },
  ];

  const stats = [
    { label: 'Statut',   value: STATUS_LABELS[dossier.status] || dossier.status, color: '#A78BFA' },
    { label: 'Secteur',  value: dossier.secteur || '—', color: 'var(--c-text)' },
    { label: 'Taille',   value: dossier.taille  || '—', color: 'var(--c-text)' },
    { label: 'Créé le',  value: dossier.date_creation || '—', mono: true, color: 'var(--c-text2)' },
  ];

  return (
    <>
      {/* Overview stats */}
      <div className="cl-overview-grid">
        {stats.map((s) => (
          <div className="cl-stat-card" key={s.label} style={{ '--stat-color': '#A78BFA' }}>
            <div className="cl-stat-label">{s.label}</div>
            <div
              className="cl-stat-value"
              style={{
                color: s.color,
                fontFamily: s.mono ? 'var(--f-mono)' : undefined,
                fontSize: s.mono ? 20 : 26,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Score section */}
      {dossier.score != null && (
        <div className="cl-score-section">
          <div className="cl-score-big">{dossier.score}</div>
          <div className="cl-score-info">
            <h3>Score de risque cyber</h3>
            <p>
              Niveau de risque:&nbsp;
              <strong style={{ color: RISK_COLORS[dossier.niveau_risque] || '#A78BFA' }}>
                {dossier.niveau_risque}
              </strong>
            </p>
            <div className="cl-score-bar">
              <div className="cl-score-fill" style={{ width: `${dossier.score}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Progression */}
      <div className="cl-panel">
        <div className="cl-panel-header">
          <span className="cl-panel-title">Progression</span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div className="cl-steps">
            {steps.map((s) => (
              <button
                key={s.key}
                className={`cl-step-btn ${s.done ? 'cl-step-btn--done' : ''}`}
                onClick={() => onNavigate(s.key)}
              >
                <i
                  className={s.icon}
                  style={{ fontSize: 22, color: s.done ? '#A78BFA' : 'var(--c-text3)', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div className="cl-step-label" style={{ color: s.done ? '#A78BFA' : 'var(--c-text)' }}>
                    {s.label}
                  </div>
                  <div className="cl-step-sub">{s.sub}</div>
                </div>
                {s.done && <i className="ti ti-circle-check cl-step-check" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Devis résumé */}
      {dossier.devis && (
        <div className="cl-devis-card">
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--c-text3)', fontWeight: 600, marginBottom: 12 }}>
            VOTRE DEVIS
          </div>
          <div className="cl-devis-prime">
            {dossier.devis.prime?.toLocaleString('fr-FR')}<span> €/an</span>
          </div>
          <div className="cl-devis-label">PRIME ANNUELLE ESTIMÉE</div>
          <span className={`cl-badge cl-badge--${dossier.devis.status}`}>{dossier.devis.status}</span>
          {dossier.devis.motif && (
            <div className="cl-motif" style={{ marginTop: 16 }}>
              <i className="ti ti-info-circle" style={{ fontSize: 16, flexShrink: 0 }} />
              {dossier.devis.motif}
            </div>
          )}
        </div>
      )}
    </>
  );
}
