import React, { useState, useEffect } from 'react';
import { assureurAPI } from '../../services/assureurAPI';

const RISK_COLOR = { Critique: '#FF4466', Élevé: '#FF8C42', Moyen: '#FFB347', Faible: '#4DFFB4', Minimal: '#00D4FF' };

export default function AssureurDevis() {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('en_attente');
  const [modal, setModal] = useState(null);
  const [motif, setMotif] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    assureurAPI.getDevis()
      .then(r => setDevis(r.data?.devis || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleValider = async (id) => {
    setActionLoading(true);
    try {
      await assureurAPI.validerDevis(id);
      setDevis(prev => prev.map(d => d.id === id ? { ...d, status: 'valide' } : d));
      showToast('Devis validé avec succès');
    } catch {
      showToast('Erreur lors de la validation', 'warning');
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  };

  const handleRejeter = async (id) => {
    setActionLoading(true);
    try {
      await assureurAPI.rejeterDevis(id, motif);
      setDevis(prev => prev.map(d => d.id === id ? { ...d, status: 'rejete' } : d));
      showToast('Devis rejeté', 'warning');
    } catch {
      showToast('Erreur lors du rejet', 'warning');
    } finally {
      setActionLoading(false);
      setModal(null);
      setMotif('');
    }
  };

  const filtered = devis.filter(d => filter === 'all' || d.status === filter);

  return (
    <div className="as-page fade-in">
      {/* Toast */}
      {toast && (
        <div className={`as-toast as-toast--${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-circle-check' : 'ti-alert-triangle'}`} aria-hidden="true" />
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="as-modal-overlay" onClick={() => setModal(null)}>
          <div className="as-modal" onClick={e => e.stopPropagation()}>
            <div className="as-modal-header">
              <h3 className="as-modal-title">
                {modal.action === 'valider' ? '✓ Valider ce devis' : '✗ Rejeter ce devis'}
              </h3>
            </div>
            <div className="as-modal-body">
              <div className="as-modal-summary">
                <div className="as-modal-company">{modal.devis.company}</div>
                <div className="as-modal-prime">
                  Prime : <strong>{modal.devis.prime?.toLocaleString('fr-FR')} €/an</strong>
                </div>
                <div className="as-modal-score">
                  Score : <span style={{ color: RISK_COLOR[modal.devis.niveau_risque] }}>{modal.devis.score}/100 — {modal.devis.niveau_risque}</span>
                </div>
              </div>
              {modal.action === 'rejeter' && (
                <div className="as-modal-field">
                  <label className="as-modal-label">MOTIF DE REJET</label>
                  <textarea
                    className="as-modal-textarea"
                    placeholder="Expliquez la raison du rejet..."
                    value={motif}
                    onChange={e => setMotif(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
            <div className="as-modal-footer">
              <button className="as-modal-cancel" onClick={() => setModal(null)}>Annuler</button>
              {modal.action === 'valider' ? (
                <button
                  className="as-modal-confirm as-modal-confirm--green"
                  onClick={() => handleValider(modal.devis.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? <span className="as-spinner as-spinner--sm" /> : <i className="ti ti-check" aria-hidden="true" />}
                  Confirmer la validation
                </button>
              ) : (
                <button
                  className="as-modal-confirm as-modal-confirm--red"
                  onClick={() => handleRejeter(modal.devis.id)}
                  disabled={actionLoading || !motif.trim()}
                >
                  {actionLoading ? <span className="as-spinner as-spinner--sm" /> : <i className="ti ti-x" aria-hidden="true" />}
                  Confirmer le rejet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="as-toolbar">
        <div className="as-filter-tabs">
          {[
            { key: 'en_attente', label: 'À valider', count: devis.filter(d => d.status === 'en_attente').length },
            { key: 'valide',     label: 'Validés',   count: devis.filter(d => d.status === 'valide').length },
            { key: 'rejete',     label: 'Rejetés',   count: devis.filter(d => d.status === 'rejete').length },
            { key: 'all',        label: 'Tous',      count: devis.length },
          ].map(f => (
            <button
              key={f.key}
              className={`as-filter-tab ${filter === f.key ? 'as-filter-tab--active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="as-filter-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="as-devis-grid">
          {filtered.map((d, i) => {
            const rc = RISK_COLOR[d.niveau_risque];
            const isPending = d.status === 'en_attente';
            return (
              <div key={i} className={`as-devis-card ${!isPending ? 'as-devis-card--done' : ''}`} style={{ '--devis-color': rc }}>
                <div className="as-devis-top">
                  <div className="as-devis-company">{d.company}</div>
                  <span className={`as-devis-status ${d.status === 'valide' ? 'as-devis-status--green' : d.status === 'rejete' ? 'as-devis-status--red' : 'as-devis-status--orange'}`}>
                    {d.status === 'en_attente' ? 'En attente' : d.status === 'valide' ? 'Validé' : 'Rejeté'}
                  </span>
                </div>

                <div className="as-devis-prime">
                  {d.prime?.toLocaleString('fr-FR')} <span>€/an</span>
                </div>

                <div className="as-devis-metrics">
                  <div className="as-devis-metric">
                    <span className="as-devis-metric-label">Score</span>
                    <span className="as-devis-metric-value" style={{ color: rc }}>{d.score}/100</span>
                  </div>
                  <div className="as-devis-metric">
                    <span className="as-devis-metric-label">Risque</span>
                    <span className="as-devis-metric-value" style={{ color: rc }}>{d.niveau_risque}</span>
                  </div>
                  <div className="as-devis-metric">
                    <span className="as-devis-metric-label">Date</span>
                    <span className="as-devis-metric-value">{d.date}</span>
                  </div>
                </div>

                <div className="as-devis-risk-bar">
                  <div style={{ width: `${d.score}%`, background: rc, height: '100%', borderRadius: '2px', transition: 'width 0.8s' }} />
                </div>

                {isPending && (
                  <div className="as-devis-actions">
                    <button
                      className="as-action-btn as-action-btn--reject"
                      onClick={() => setModal({ action: 'rejeter', devis: d })}
                    >
                      <i className="ti ti-x" aria-hidden="true" />
                      Rejeter
                    </button>
                    <button
                      className="as-action-btn as-action-btn--validate"
                      onClick={() => setModal({ action: 'valider', devis: d })}
                    >
                      <i className="ti ti-check" aria-hidden="true" />
                      Valider
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="as-empty as-empty--full">
              <i className="ti ti-file-off" aria-hidden="true" />
              <span>Aucun devis dans cette catégorie</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Loader() {
  return <div className="as-loader"><div className="as-spinner" /></div>;
}
