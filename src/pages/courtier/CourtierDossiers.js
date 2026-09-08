import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { courtierAPI } from '../../services/courtierAPI';
import { analyseAPI } from '../../services/analyseAPI';
import { AnalyseBadge, AnalysePanel, EN_COURS } from '../../components/AnalyseIA';
import '../../components/AnalyseIA.css';

const STATUS_LABELS = {
  draft: 'Brouillon', soumis: 'Soumis', en_analyse: 'En analyse',
  devis_genere: 'Devis généré', valide: 'Validé', rejete: 'Rejeté',
};

const POLL_MS = 3000;

function AnalyseModal({ dossier, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [service, setService] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [ouvert, setOuvert] = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await analyseAPI.getAnalysesDossier(dossier.id);
      setData(res.data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.detail || 'Impossible de charger les analyses');
    } finally { setLoading(false); }
  }, [dossier.id]);

  useEffect(() => {
    analyseAPI.getStatus().then((r) => setService(r.data)).catch(() => setService(null));
    load();
  }, [load]);

  // Polling tant qu'une analyse est en attente ou en cours.
  useEffect(() => {
    const enCours = data?.documents?.some(
      (d) => d.analyse && EN_COURS.includes(d.analyse.status));
    if (!enCours) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    if (!pollRef.current) pollRef.current = setInterval(load, POLL_MS);
  }, [data, load]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleAnalyser = async (idDocument) => {
    setActionLoading(idDocument);
    try { await analyseAPI.lancer(idDocument); await load(); }
    catch (e) { setError(e.response?.data?.detail || 'Erreur au lancement de l\'analyse'); }
    finally { setActionLoading(null); }
  };

  const indisponible = service && service.disponible === false;

  return ReactDOM.createPortal(
    <div className="co-modal-overlay" onClick={onClose}>
      <div className="co-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="co-modal-header">
          <span className="co-modal-title">
            <i className="ti ti-sparkles" aria-hidden="true" /> Analyse IA — {dossier.company}
          </span>
        </div>
        <div className="co-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {error && <div style={{ color: 'var(--c-red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          {indisponible && (
            <div style={{ color: 'var(--c-orange, #FFB347)', fontSize: 13, marginBottom: 12 }}>
              <i className="ti ti-alert-circle" aria-hidden="true" /> {service.message}
            </div>
          )}
          {service?.disponible && service.simule && (
            <div className="ia-trace" style={{ borderTop: 'none', marginTop: 0, marginBottom: 14, paddingTop: 0 }}>
              Fournisseur : {service.provider} ({service.modele}) — analyses simulées,
              aucun document n'est transmis à un service externe.
            </div>
          )}

          {loading && <div className="co-loader"><div className="co-spinner" /></div>}

          {!loading && data && data.documents.length === 0 && (
            <div className="co-empty"><i className="ti ti-files-off" /><p>Aucun document déposé</p></div>
          )}

          {!loading && data?.documents?.map((d) => {
            const a = d.analyse;
            const consultable = a && ['terminee', 'echec'].includes(a.status);
            const deplie = ouvert === d.id_document;
            const enCours = a && EN_COURS.includes(a.status);
            return (
              <div key={d.id_document} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <i className="ti ti-file" style={{ color: '#A78BFA' }} aria-hidden="true" />
                  <span style={{ fontSize: 13, flex: 1, minWidth: 140 }}>{d.nom}</span>
                  <span className="co-td-date">{d.type}</span>
                  <AnalyseBadge status={a?.status} />
                  {!enCours && (
                    <button
                      className="ia-btn"
                      disabled={actionLoading === d.id_document || indisponible}
                      onClick={() => handleAnalyser(d.id_document)}
                    >
                      <i className="ti ti-sparkles" aria-hidden="true" />
                      {actionLoading === d.id_document
                        ? 'Lancement…'
                        : a ? 'Relancer' : 'Analyser'}
                    </button>
                  )}
                  {consultable && (
                    <button
                      className="ia-doc-toggle"
                      onClick={() => setOuvert(deplie ? null : d.id_document)}
                      aria-expanded={deplie}
                      aria-label={deplie ? 'Masquer l\'analyse' : 'Voir l\'analyse'}
                    >
                      <i className={`ti ti-chevron-${deplie ? 'up' : 'down'}`} />
                    </button>
                  )}
                </div>
                {deplie && <AnalysePanel analyse={a} />}
              </div>
            );
          })}

          {!loading && data && data.score_document > 0 && (
            <div className="ia-trace">
              Score documentaire du dossier : <strong>{data.score_document}</strong>/100
              {' '}({data.analyses_terminees} document(s) analysé(s)) — pondéré à 40 % dans le score global.
            </div>
          )}
        </div>
        <div className="co-modal-footer">
          <button className="co-modal-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CreateDossierModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ nom: '', secteur: '', taille: 'PME', client_email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nom.trim()) { setError('Nom de l\'entreprise requis'); return; }
    setLoading(true); setError('');
    try {
      const body = {
        entreprise: { nom: form.nom, secteur: form.secteur || null, taille: form.taille || null },
        client_email: form.client_email || null,
      };
      await courtierAPI.createDossier(body);
      onCreated();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return ReactDOM.createPortal(
    <div className="co-modal-overlay" onClick={onClose}>
      <div className="co-modal" onClick={(e) => e.stopPropagation()}>
        <div className="co-modal-header">
          <span className="co-modal-title">Nouveau dossier</span>
        </div>
        <div className="co-modal-body">
          {error && <div style={{ color: 'var(--c-red)', fontSize: 13 }}>{error}</div>}
          <div className="co-form-field">
            <label className="co-form-label">Nom de l'entreprise *</label>
            <input className="co-form-input" value={form.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Ex: Acme SAS" />
          </div>
          <div className="co-form-field">
            <label className="co-form-label">Secteur</label>
            <input className="co-form-input" value={form.secteur} onChange={(e) => set('secteur', e.target.value)} placeholder="Finance, Santé, Industrie..." />
          </div>
          <div className="co-form-field">
            <label className="co-form-label">Taille</label>
            <select className="co-form-select" value={form.taille} onChange={(e) => set('taille', e.target.value)}>
              <option value="Startup">Startup</option>
              <option value="PME">PME</option>
              <option value="ETI">ETI</option>
              <option value="GE">Grande Entreprise</option>
            </select>
          </div>
          <div className="co-form-field">
            <label className="co-form-label">Email client (optionnel)</label>
            <input className="co-form-input" value={form.client_email} onChange={(e) => set('client_email', e.target.value)} placeholder="client@example.com" />
          </div>
        </div>
        <div className="co-modal-footer">
          <button className="co-modal-cancel" onClick={onClose}>Annuler</button>
          <button className="co-modal-confirm" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Création...' : 'Créer le dossier'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CourtierDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [analyseDossier, setAnalyseDossier] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await courtierAPI.getDossiers(params);
      setDossiers(res.data.dossiers);
      setTotal(res.data.total);
    } catch { setError('Impossible de charger les dossiers'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSoumettre = async (id) => {
    setActionLoading(id + '-s');
    try { await courtierAPI.soumettreDossier(id); load(); }
    catch (e) { alert(e.response?.data?.detail || 'Erreur'); }
    finally { setActionLoading(null); }
  };

  const handleDevis = async (id) => {
    setActionLoading(id + '-d');
    try { await courtierAPI.demanderDevis(id); load(); }
    catch (e) { alert(e.response?.data?.detail || 'Erreur'); }
    finally { setActionLoading(null); }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="co-toolbar">
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          <div className="co-search-wrap">
            <i className="co-search-icon ti ti-search" />
            <input
              className="co-search"
              placeholder="Rechercher une entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="co-filter-tabs">
            {['', 'draft', 'soumis', 'en_analyse', 'devis_genere', 'valide'].map((s) => (
              <button
                key={s}
                className={`co-filter-tab ${statusFilter === s ? 'co-filter-tab--active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === '' ? 'Tous' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button className="co-btn-primary" onClick={() => setShowCreate(true)}>
          <i className="ti ti-plus" /> Nouveau dossier
        </button>
      </div>

      {/* Table */}
      <div className="co-panel">
        <div className="co-panel-header">
          <span className="co-panel-title">
            Dossiers <span className="co-count">{total}</span>
          </span>
        </div>

        {loading && <div className="co-loader"><div className="co-spinner" /></div>}
        {error && (
          <div className="co-empty" style={{ color: 'var(--c-red)' }}>
            <i className="ti ti-alert-circle" /><p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="co-table-wrap">
            <table className="co-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Entreprise</th>
                  <th>Secteur</th>
                  <th>Taille</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((d) => (
                  <tr key={d.id}>
                    <td className="co-td-id">#{d.id}</td>
                    <td className="co-td-company">{d.company}</td>
                    <td className="co-td-dim">{d.secteur || '—'}</td>
                    <td className="co-td-dim">{d.taille || '—'}</td>
                    <td>
                      {d.client_email
                        ? <span style={{ fontSize: 12, color: '#4DFFB4' }}>{d.client_email}</span>
                        : <span className="co-td-id">—</span>}
                    </td>
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
                      ) : <span className="co-td-id">—</span>}
                    </td>
                    <td className="co-td-date">{d.date_creation}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {d.status === 'draft' && (
                          <button
                            className="co-row-btn"
                            disabled={actionLoading === d.id + '-s'}
                            onClick={() => handleSoumettre(d.id)}
                          >
                            <i className="ti ti-send" /> Soumettre
                          </button>
                        )}
                        {['soumis', 'en_analyse'].includes(d.status) && (
                          <button
                            className="co-row-btn co-row-btn--primary"
                            disabled={actionLoading === d.id + '-d'}
                            onClick={() => handleDevis(d.id)}
                          >
                            <i className="ti ti-file-invoice" /> Devis
                          </button>
                        )}
                        {d.status !== 'draft' && (
                          <button
                            className="co-row-btn"
                            onClick={() => setAnalyseDossier(d)}
                            title="Analyse IA des preuves documentaires"
                          >
                            <i className="ti ti-sparkles" /> Analyse IA
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && dossiers.length === 0 && (
          <div className="co-empty"><i className="ti ti-folder-off" /><p>Aucun dossier trouvé</p></div>
        )}
      </div>

      {showCreate && (
        <CreateDossierModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}

      {analyseDossier && (
        <AnalyseModal
          dossier={analyseDossier}
          onClose={() => { setAnalyseDossier(null); load(); }}
        />
      )}
    </>
  );
}
