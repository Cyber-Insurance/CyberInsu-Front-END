import React from 'react';

export const ANALYSE_STATUS_LABELS = {
  en_attente: 'En attente',
  en_cours: 'Analyse en cours',
  terminee: 'Analysé',
  echec: 'Échec',
};

const STATUS_STYLE = {
  en_attente: { color: '#FFB347', icon: 'ti-clock' },
  en_cours: { color: '#60a5fa', icon: 'ti-loader-2' },
  terminee: { color: '#4DFFB4', icon: 'ti-sparkles' },
  echec: { color: '#FF4466', icon: 'ti-alert-triangle' },
};

const DOMAINE_LABELS = {
  gouvernance: 'Gouvernance',
  securite: 'Sécurité',
  infrastructure: 'Infrastructure',
  incidents: 'Incidents',
};

const NIVEAU_STYLE = {
  conforme: { label: 'Conforme', color: '#4DFFB4' },
  partiel: { label: 'Partiel', color: '#FFB347' },
  absent: { label: 'Absent', color: '#FF4466' },
};

/** Statuts pour lesquels il faut continuer à interroger l'API. */
export const EN_COURS = ['en_attente', 'en_cours'];

/** Pastille d'état d'analyse, utilisable dans n'importe quelle liste. */
export function AnalyseBadge({ status }) {
  if (!status) {
    return (
      <span className="ia-badge" style={{ color: 'var(--c-text3)', borderColor: 'var(--c-border)' }}>
        <i className="ti ti-circle-dashed" aria-hidden="true" /> Non analysé
      </span>
    );
  }
  const s = STATUS_STYLE[status] || STATUS_STYLE.en_attente;
  return (
    <span
      className={`ia-badge ${EN_COURS.includes(status) ? 'ia-badge--pulse' : ''}`}
      style={{ color: s.color, borderColor: s.color, background: `${s.color}14` }}
    >
      <i className={`ti ${s.icon}`} aria-hidden="true" />
      {ANALYSE_STATUS_LABELS[status] || status}
    </span>
  );
}

/** Panneau de restitution d'une analyse (les six champs du contrat). */
export function AnalysePanel({ analyse }) {
  if (!analyse) return null;

  if (analyse.status === 'echec') {
    return (
      <div className="ia-panel ia-panel--echec">
        <div className="ia-panel-title">
          <i className="ti ti-alert-triangle" aria-hidden="true" /> Analyse impossible
        </div>
        <p className="ia-erreur">{analyse.erreur || 'Erreur inconnue'}</p>
      </div>
    );
  }

  if (EN_COURS.includes(analyse.status)) {
    return (
      <div className="ia-panel">
        <div className="ia-panel-title">
          <i className="ti ti-loader-2 ia-spin" aria-hidden="true" /> Analyse en cours…
        </div>
      </div>
    );
  }

  const r = analyse.resultat;
  if (!r) return null;

  const confiancePct = Math.round((r.confiance ?? 0) * 100);

  return (
    <div className="ia-panel">
      {/* Synthèse */}
      <p className="ia-synthese">{r.synthese}</p>

      {/* Indicateurs */}
      <div className="ia-kpis">
        <div className="ia-kpi">
          <span className="ia-kpi-label">Score documentaire</span>
          <span className="ia-kpi-value">{analyse.score_document ?? '—'}</span>
        </div>
        <div className="ia-kpi">
          <span className="ia-kpi-label">Confiance</span>
          <span className="ia-kpi-value">{confiancePct}%</span>
        </div>
        <div className="ia-kpi">
          <span className="ia-kpi-label">Type détecté</span>
          <span className="ia-kpi-value ia-kpi-value--text">
            {(r.type_document || '').replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Mesures détectées */}
      {r.mesures_detectees?.length > 0 && (
        <div className="ia-bloc">
          <div className="ia-bloc-title">Mesures détectées</div>
          <ul className="ia-mesures">
            {r.mesures_detectees.map((m, i) => {
              const n = NIVEAU_STYLE[m.niveau] || NIVEAU_STYLE.partiel;
              return (
                <li key={i} className="ia-mesure">
                  <span className="ia-mesure-nom">{m.mesure}</span>
                  <span className="ia-mesure-domaine">{DOMAINE_LABELS[m.domaine] || m.domaine}</span>
                  <span className="ia-mesure-niveau" style={{ color: n.color, borderColor: n.color }}>
                    {n.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Référentiels */}
      {r.referentiels?.length > 0 && (
        <div className="ia-bloc">
          <div className="ia-bloc-title">Référentiels cités</div>
          <div className="ia-tags">
            {r.referentiels.map((ref, i) => <span key={i} className="ia-tag">{ref}</span>)}
          </div>
        </div>
      )}

      {/* Incohérences */}
      {r.incoherences?.length > 0 && (
        <div className="ia-bloc">
          <div className="ia-bloc-title ia-bloc-title--alerte">
            <i className="ti ti-alert-circle" aria-hidden="true" /> Incohérences relevées
          </div>
          <ul className="ia-incoherences">
            {r.incoherences.map((inc, i) => <li key={i}>{inc}</li>)}
          </ul>
        </div>
      )}

      {/* Traçabilité de l'appel */}
      <div className="ia-trace">
        {analyse.modele} · {analyse.provider}
        {analyse.latence_ms != null && ` · ${Math.round(analyse.latence_ms)} ms`}
        {analyse.tokens_entree != null &&
          ` · ${analyse.tokens_entree + (analyse.tokens_sortie || 0)} tokens`}
        {analyse.provider === 'mock' && ' · analyse simulée'}
      </div>
    </div>
  );
}
