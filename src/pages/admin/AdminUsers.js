import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';

const MOCK_USERS = [
  { id_user: 1, email: 'admin@cyber.fr',    role_status: 'admin',    mfa_enabled: true,  permissions: ['gerer_utilisateurs','gerer_roles'], created_at: '2026-05-01T10:00:00' },
  { id_user: 2, email: 'assureur@cyber.fr', role_status: 'assureur', mfa_enabled: true,  permissions: ['voir_dossiers','valider_devis'], created_at: '2026-05-05T09:30:00' },
  { id_user: 3, email: 'courtier@cyber.fr', role_status: 'courtier', mfa_enabled: false, permissions: ['creer_dossier','voir_dossiers'], created_at: '2026-05-10T11:00:00' },
  { id_user: 4, email: 'client@cyber.fr',   role_status: 'client',   mfa_enabled: false, permissions: ['remplir_questionnaire','upload_documents'], created_at: '2026-05-15T14:20:00' },
];

const MOCK_ROLES = [
  { id_role: 1, status: 'admin' },
  { id_role: 2, status: 'assureur' },
  { id_role: 3, status: 'courtier' },
  { id_role: 4, status: 'client' },
];

const ROLE_COLOR = { admin: '#FF4466', assureur: '#00D4FF', courtier: '#4DFFB4', client: '#A78BFA' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [roles, setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modal, setModal]   = useState(null); // { type: 'create'|'edit'|'delete', user? }
  const [form, setForm]     = useState({ email: '', password: '', id_role: 3 });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminAPI.getUsers(), adminAPI.getRoles()])
      .then(([ur, rr]) => {
        setUsers(ur.data?.users || ur.data || []);
        setRoles(rr.data || []);
      })
      .catch(() => { setUsers(MOCK_USERS); setRoles(MOCK_ROLES); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setForm({ email: '', password: '', id_role: 3 });
    setModal({ type: 'create' });
  };

  const openEdit = (u) => {
    setForm({ email: u.email, password: '', id_role: u.id_role });
    setModal({ type: 'edit', user: u });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.type === 'create') {
        await adminAPI.createUser(form);
        showToast('Utilisateur créé');
      } else {
        const payload = { email: form.email, id_role: form.id_role };
        if (form.password) payload.password = form.password;
        await adminAPI.updateUser(modal.user.id_user, payload);
        showToast('Utilisateur mis à jour');
      }
      load();
      setModal(null);
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminAPI.deleteUser(modal.user.id_user);
      showToast('Utilisateur supprimé', 'warning');
      load();
      setModal(null);
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users
    .filter(u => roleFilter === 'all' || u.role_status === roleFilter)
    .filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="adm-page fade-in">
      {toast && (
        <div className={`adm-toast adm-toast--${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-circle-check' : toast.type === 'warning' ? 'ti-alert-triangle' : 'ti-circle-x'}`} aria-hidden="true" />
          {toast.msg}
        </div>
      )}

      {/* Modal create / edit */}
      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">
                {modal.type === 'create' ? '+ Nouvel utilisateur' : 'Modifier l\'utilisateur'}
              </h3>
              <button className="adm-modal-close" onClick={() => setModal(null)}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-form-field">
                <label className="adm-form-label">EMAIL</label>
                <input className="adm-form-input" type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemple.com" />
              </div>
              <div className="adm-form-field">
                <label className="adm-form-label">
                  {modal.type === 'edit' ? 'NOUVEAU MOT DE PASSE (optionnel)' : 'MOT DE PASSE'}
                </label>
                <input className="adm-form-input" type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" />
              </div>
              <div className="adm-form-field">
                <label className="adm-form-label">RÔLE</label>
                <select className="adm-form-select" value={form.id_role}
                  onChange={e => setForm(f => ({ ...f, id_role: parseInt(e.target.value) }))}>
                  {roles.map(r => (
                    <option key={r.id_role} value={r.id_role}>{r.status}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Annuler</button>
              <button className="adm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="adm-spinner adm-spinner--sm" /> : <i className="ti ti-check" aria-hidden="true" />}
                {modal.type === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal delete */}
      {modal?.type === 'delete' && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal adm-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3 className="adm-modal-title adm-modal-title--red">Supprimer cet utilisateur ?</h3>
            </div>
            <div className="adm-modal-body">
              <p className="adm-modal-text">
                Cette action est <strong>irréversible</strong>. L'utilisateur <code>{modal.user.email}</code> sera définitivement supprimé.
              </p>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setModal(null)}>Annuler</button>
              <button className="adm-btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? <span className="adm-spinner adm-spinner--sm" /> : <i className="ti ti-trash" aria-hidden="true" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <i className="ti ti-search adm-search-icon" aria-hidden="true" />
          <input className="adm-search" placeholder="Rechercher un email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="adm-filter-tabs">
          {['all', 'admin', 'assureur', 'courtier', 'client'].map(r => (
            <button key={r}
              className={`adm-filter-tab ${roleFilter === r ? 'adm-filter-tab--active' : ''}`}
              onClick={() => setRoleFilter(r)}
              style={roleFilter === r && r !== 'all' ? { borderColor: ROLE_COLOR[r] + '60', color: ROLE_COLOR[r], background: ROLE_COLOR[r] + '10' } : {}}>
              {r === 'all' ? 'Tous' : r}
            </button>
          ))}
        </div>
        <button className="adm-btn-primary" onClick={openCreate}>
          <i className="ti ti-user-plus" aria-hidden="true" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Table */}
      {loading ? <Loader /> : (
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2 className="adm-panel-title">Utilisateurs <span className="adm-count">{filtered.length}</span></h2>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th><th>Email</th><th>Rôle</th><th>MFA</th>
                  <th>Permissions</th><th>Créé le</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const rc = ROLE_COLOR[u.role_status] || '#888';
                  return (
                    <tr key={i}>
                      <td className="adm-td-id">#{u.id_user}</td>
                      <td className="adm-td-email">{u.email}</td>
                      <td>
                        <span className="adm-badge" style={{ color: rc, background: rc + '15', borderColor: rc + '30' }}>
                          {u.role_status}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-mfa-chip ${u.mfa_enabled ? 'adm-mfa-chip--on' : 'adm-mfa-chip--off'}`}>
                          <i className={`ti ${u.mfa_enabled ? 'ti-shield-check' : 'ti-shield-off'}`} aria-hidden="true" />
                          {u.mfa_enabled ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="adm-perms-wrap">
                          {u.permissions?.slice(0, 2).map((p, j) => (
                            <span key={j} className="adm-perm-chip">{p}</span>
                          ))}
                          {u.permissions?.length > 2 && (
                            <span className="adm-perm-more">+{u.permissions.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="adm-td-date">{fmtDate(u.created_at)}</td>
                      <td>
                        <div className="adm-row-actions">
                          <button className="adm-row-btn" onClick={() => openEdit(u)} title="Modifier">
                            <i className="ti ti-edit" aria-hidden="true" />
                          </button>
                          <button className="adm-row-btn adm-row-btn--danger" onClick={() => setModal({ type: 'delete', user: u })} title="Supprimer">
                            <i className="ti ti-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="adm-empty">
                <i className="ti ti-users-off" aria-hidden="true" />
                <span>Aucun utilisateur trouvé</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Loader() {
  return <div className="adm-loader"><div className="adm-spinner" /></div>;
}
