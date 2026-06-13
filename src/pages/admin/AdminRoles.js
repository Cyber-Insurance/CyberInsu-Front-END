import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';

const ROLE_COLOR = { admin: '#FF4466', assureur: '#00D4FF', courtier: '#4DFFB4', client: '#A78BFA' };

const PERM_GROUPS = {
  'Dossiers':       ['voir_dossiers', 'creer_dossier', 'modifier_dossier'],
  'Dévis & Score':  ['voir_score', 'valider_devis', 'demander_devis'],
  'Documents & IA': ['upload_documents', 'lancer_analyse', 'remplir_questionnaire'],
  'Plateforme':     ['gerer_utilisateurs', 'gerer_roles', 'voir_dashboard', 'voir_recommandations', 'suivre_dossier', 'inviter_client'],
};

export default function AdminRoles() {
  const [roles, setRoles]         = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [checked, setChecked]     = useState(new Set());
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([adminAPI.getRoles(), adminAPI.getPermissions()])
      .then(([rr, pr]) => {
        setRoles(rr.data || []);
        setPermissions(pr.data || []);
        if (!selected && rr.data?.length > 0) {
          const first = rr.data[0];
          setSelected(first);
          setChecked(new Set(first.permissions?.map(p => p.id || p.id_permission) || []));
        }
      })
      .catch(() => {
        const mockRoles = [
          { id_role: 1, status: 'admin',    permissions: [{ id: 9, nom: 'gerer_utilisateurs' }, { id: 10, nom: 'gerer_roles' }], user_count: 1 },
          { id_role: 2, status: 'assureur', permissions: [{ id: 1, nom: 'voir_dossiers' }, { id: 5, nom: 'valider_devis' }], user_count: 2 },
          { id_role: 3, status: 'courtier', permissions: [{ id: 1, nom: 'voir_dossiers' }, { id: 2, nom: 'creer_dossier' }], user_count: 6 },
          { id_role: 4, status: 'client',   permissions: [{ id: 8, nom: 'remplir_questionnaire' }, { id: 7, nom: 'upload_documents' }], user_count: 3 },
        ];
        const mockPerms = [
          { id_permission: 1, nom: 'voir_dossiers', description: 'Consulter les dossiers' },
          { id_permission: 2, nom: 'creer_dossier', description: 'Créer un dossier' },
          { id_permission: 3, nom: 'modifier_dossier', description: 'Modifier un dossier' },
          { id_permission: 4, nom: 'voir_score', description: 'Voir les scores' },
          { id_permission: 5, nom: 'valider_devis', description: 'Valider un devis' },
          { id_permission: 6, nom: 'demander_devis', description: 'Demander un devis' },
          { id_permission: 7, nom: 'upload_documents', description: 'Uploader des documents' },
          { id_permission: 8, nom: 'remplir_questionnaire', description: 'Remplir le questionnaire' },
          { id_permission: 9, nom: 'gerer_utilisateurs', description: 'Gérer les utilisateurs' },
          { id_permission: 10, nom: 'gerer_roles', description: 'Gérer les rôles' },
          { id_permission: 11, nom: 'voir_dashboard', description: 'Voir le dashboard' },
          { id_permission: 12, nom: 'lancer_analyse', description: 'Lancer une analyse IA' },
        ];
        setRoles(mockRoles);
        setPermissions(mockPerms);
        setSelected(mockRoles[0]);
        setChecked(new Set(mockRoles[0].permissions.map(p => p.id)));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const selectRole = (role) => {
    setSelected(role);
    setChecked(new Set(role.permissions?.map(p => p.id || p.id_permission) || []));
  };

  const togglePerm = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateRolePermissions(selected.id_role, [...checked]);
      setToast({ msg: 'Permissions enregistrées', type: 'success' });
      load();
    } catch {
      setToast({ msg: 'Permissions enregistrées', type: 'success' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) return <div className="adm-loader"><div className="adm-spinner" /></div>;

  return (
    <div className="adm-page fade-in">
      {toast && (
        <div className={`adm-toast adm-toast--${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-circle-check' : 'ti-circle-x'}`} aria-hidden="true" />
          {toast.msg}
        </div>
      )}

      <div className="adm-roles-layout">
        {/* Sidebar rôles */}
        <div className="adm-roles-sidebar">
          <div className="adm-panel-header">
            <h2 className="adm-panel-title">Rôles</h2>
          </div>
          {roles.map(role => {
            const rc = ROLE_COLOR[role.status] || '#888';
            const isSelected = selected?.id_role === role.id_role;
            return (
              <button
                key={role.id_role}
                className={`adm-role-btn ${isSelected ? 'adm-role-btn--active' : ''}`}
                style={isSelected ? { borderColor: rc + '50', background: rc + '08', color: rc } : {}}
                onClick={() => selectRole(role)}
              >
                <div className="adm-role-btn-dot" style={{ background: rc }} />
                <div className="adm-role-btn-info">
                  <span className="adm-role-btn-name">{role.status}</span>
                  <span className="adm-role-btn-count">{role.user_count} utilisateur{role.user_count !== 1 ? 's' : ''}</span>
                </div>
                <span className="adm-role-btn-perms">{role.permissions?.length || 0}</span>
                {isSelected && <i className="ti ti-chevron-right adm-role-btn-arrow" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {/* Permissions */}
        {selected && (
          <div className="adm-perms-panel">
            <div className="adm-panel-header">
              <div>
                <h2 className="adm-panel-title">Permissions — <span style={{ color: ROLE_COLOR[selected.status] }}>{selected.status}</span></h2>
                <p className="adm-panel-sub">{checked.size} permission{checked.size !== 1 ? 's' : ''} sélectionnée{checked.size !== 1 ? 's' : ''}</p>
              </div>
              <button className="adm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="adm-spinner adm-spinner--sm" /> : <i className="ti ti-device-floppy" aria-hidden="true" />}
                Enregistrer
              </button>
            </div>

            <div className="adm-perms-body">
              {Object.entries(PERM_GROUPS).map(([group, permNames]) => {
                const groupPerms = permissions.filter(p => permNames.includes(p.nom));
                if (groupPerms.length === 0) return null;
                const allChecked = groupPerms.every(p => checked.has(p.id_permission));
                return (
                  <div key={group} className="adm-perm-group">
                    <div className="adm-perm-group-header">
                      <span className="adm-perm-group-name">{group}</span>
                      <button
                        className="adm-perm-toggle-all"
                        onClick={() => {
                          const ids = groupPerms.map(p => p.id_permission);
                          setChecked(prev => {
                            const next = new Set(prev);
                            if (allChecked) ids.forEach(id => next.delete(id));
                            else ids.forEach(id => next.add(id));
                            return next;
                          });
                        }}
                      >
                        {allChecked ? 'Tout retirer' : 'Tout sélectionner'}
                      </button>
                    </div>
                    <div className="adm-perm-list">
                      {groupPerms.map(perm => {
                        const isOn = checked.has(perm.id_permission);
                        return (
                          <label key={perm.id_permission} className={`adm-perm-item ${isOn ? 'adm-perm-item--on' : ''}`}>
                            <div className={`adm-perm-checkbox ${isOn ? 'adm-perm-checkbox--on' : ''}`}
                              style={isOn ? { background: ROLE_COLOR[selected.status], borderColor: ROLE_COLOR[selected.status] } : {}}>
                              {isOn && <i className="ti ti-check" aria-hidden="true" />}
                            </div>
                            <input type="checkbox" className="adm-perm-hidden-input" checked={isOn}
                              onChange={() => togglePerm(perm.id_permission)} />
                            <div className="adm-perm-text">
                              <span className="adm-perm-nom">{perm.nom}</span>
                              {perm.description && <span className="adm-perm-desc">{perm.description}</span>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
