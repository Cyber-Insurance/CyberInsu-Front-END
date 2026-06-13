import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { courtierAPI } from '../../services/courtierAPI';

function InviteModal({ onClose, onInvited }) {
  const [form, setForm] = useState({ email: '', password: '', dossier_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.dossier_id) {
      setError('Tous les champs sont requis'); return;
    }
    setLoading(true); setError('');
    try {
      await courtierAPI.inviterClient({
        email: form.email,
        password: form.password,
        dossier_id: parseInt(form.dossier_id, 10),
      });
      onInvited();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de l\'invitation');
    } finally { setLoading(false); }
  };

  return ReactDOM.createPortal(
    <div className="co-modal-overlay" onClick={onClose}>
      <div className="co-modal" onClick={(e) => e.stopPropagation()}>
        <div className="co-modal-header">
          <span className="co-modal-title">Inviter un client</span>
        </div>
        <div className="co-modal-body">
          {error && <div style={{ color: 'var(--c-red)', fontSize: 13 }}>{error}</div>}
          <div className="co-form-field">
            <label className="co-form-label">Email client *</label>
            <input className="co-form-input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="client@example.com" />
          </div>
          <div className="co-form-field">
            <label className="co-form-label">Mot de passe temporaire *</label>
            <input className="co-form-input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
          </div>
          <div className="co-form-field">
            <label className="co-form-label">ID du dossier *</label>
            <input className="co-form-input" type="number" value={form.dossier_id} onChange={(e) => set('dossier_id', e.target.value)} placeholder="42" />
          </div>
        </div>
        <div className="co-modal-footer">
          <button className="co-modal-cancel" onClick={onClose}>Annuler</button>
          <button className="co-modal-confirm" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Invitation...' : 'Inviter'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CourtierClients() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await courtierAPI.getClients();
      setClients(res.data.clients);
      setTotal(res.data.total);
    } catch { setError('Impossible de charger les clients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="co-btn-primary" onClick={() => setShowInvite(true)}>
          <i className="ti ti-user-plus" /> Inviter un client
        </button>
      </div>

      <div className="co-panel">
        <div className="co-panel-header">
          <span className="co-panel-title">
            Clients <span className="co-count">{total}</span>
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
                  <th>Client</th>
                  <th>Entreprise</th>
                  <th>Dossier</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id_user}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="co-client-av">{c.email[0].toUpperCase()}</div>
                        <span style={{ fontSize: 13 }}>{c.email}</span>
                      </div>
                    </td>
                    <td className="co-td-company">{c.company || '—'}</td>
                    <td className="co-td-id">#{c.dossier_id}</td>
                    <td>
                      {c.dossier_status && (
                        <span className={`co-badge co-badge--${c.dossier_status}`}>
                          {c.dossier_status}
                        </span>
                      )}
                    </td>
                    <td className="co-td-date">{c.created_at || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && clients.length === 0 && (
          <div className="co-empty"><i className="ti ti-users-off" /><p>Aucun client associé</p></div>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); load(); }}
        />
      )}
    </>
  );
}
