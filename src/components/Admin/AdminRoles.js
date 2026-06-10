import React, { useState } from 'react';

export default function AdminRoles({ onRefresh }) {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Administrateur',
      color: '#FF4466',
      userCount: 2,
      permissions: ['manage_users', 'manage_roles', 'view_audit_logs', 'manage_settings', 'export_data'],
    },
    {
      id: 2,
      name: 'Assureur',
      color: '#00D4FF',
      userCount: 12,
      permissions: ['view_dossiers', 'validate_devis', 'view_scores', 'export_dossiers'],
    },
    {
      id: 3,
      name: 'Courtier',
      color: '#4DFFB4',
      userCount: 45,
      permissions: ['create_dossier', 'view_my_dossiers', 'upload_documents', 'view_scores', 'request_devis'],
    },
    {
      id: 4,
      name: 'Client',
      color: '#9B8FFF',
      userCount: 156,
      permissions: ['complete_questionnaire', 'view_my_documents', 'view_my_score', 'view_recommendations'],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#4DFFB4',
    permissions: [],
  });

  const allPermissions = [
    { id: 'manage_users', label: 'Gérer les utilisateurs' },
    { id: 'manage_roles', label: 'Gérer les rôles et permissions' },
    { id: 'view_audit_logs', label: 'Consulter les logs d\'audit' },
    { id: 'manage_settings', label: 'Configurer les paramètres système' },
    { id: 'export_data', label: 'Exporter les données' },
    { id: 'view_dossiers', label: 'Consulter les dossiers' },
    { id: 'validate_devis', label: 'Valider les devis' },
    { id: 'view_scores', label: 'Consulter les scores de risque' },
    { id: 'export_dossiers', label: 'Exporter les dossiers' },
    { id: 'create_dossier', label: 'Créer un dossier' },
    { id: 'view_my_dossiers', label: 'Consulter mes dossiers' },
    { id: 'upload_documents', label: 'Télécharger des documents' },
    { id: 'request_devis', label: 'Demander un devis' },
    { id: 'complete_questionnaire', label: 'Remplir le questionnaire' },
    { id: 'view_my_documents', label: 'Consulter mes documents' },
    { id: 'view_my_score', label: 'Consulter mon score' },
    { id: 'view_recommendations', label: 'Consulter les recommandations' },
  ];

  const getPermissionLabel = (permissionId) => {
    return allPermissions.find(p => p.id === permissionId)?.label || permissionId;
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setFormData({ name: '', color: '#4DFFB4', permissions: [] });
    setShowModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, color: role.color, permissions: [...role.permissions] });
    setShowModal(true);
  };

  const handleSaveRole = () => {
    if (selectedRole) {
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, ...formData } : r));
    } else {
      setRoles([...roles, { id: roles.length + 1, ...formData, userCount: 0 }]);
    }
    setShowModal(false);
    onRefresh();
  };

  const handleDeleteRole = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      setRoles(roles.filter(r => r.id !== id));
      onRefresh();
    }
  };

  const handlePermissionToggle = (permissionId) => {
    const updated = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    setFormData({ ...formData, permissions: updated });
  };

  return (
    <div className="admin-roles">
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Rôles et Permissions</h2>
          <div className="admin-section-actions">
            <button className="admin-btn admin-btn--primary" onClick={handleAddRole}>
              ➕ Créer rôle
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {roles.map(role => (
            <div
              key={role.id}
              className="admin-section"
              style={{
                background: `${role.color}08`,
                borderColor: `${role.color}30`,
                margin: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: role.color }}>
                    ● {role.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--c-text2)', marginTop: '4px' }}>
                    {role.userCount} utilisateur{role.userCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="admin-btn admin-btn--small"
                    onClick={() => handleEditRole(role)}
                    style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', borderColor: 'rgba(0,212,255,0.2)' }}
                  >
                    ✏️
                  </button>
                  <button
                    className="admin-btn admin-btn--small admin-btn--danger"
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: 'var(--c-text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Permissions ({role.permissions.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {role.permissions.length > 0 ? (
                    role.permissions.map(perm => (
                      <span
                        key={perm}
                        className="admin-badge admin-badge--active"
                        style={{ background: `${role.color}20`, borderColor: `${role.color}40`, color: role.color, fontSize: '10px' }}
                      >
                        ✓ {getPermissionLabel(perm).substring(0, 20)}...
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--c-text2)' }}>Aucune permission</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 className="admin-modal-header">
              {selectedRole ? 'Modifier rôle' : 'Créer un nouveau rôle'}
            </h2>

            <form className="admin-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Nom du rôle</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Modérateur"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Couleur</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--c-border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="admin-form-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Permissions ({formData.permissions.length})</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '300px', overflowY: 'auto', padding: '8px', background: 'var(--c-surface2)', borderRadius: '6px' }}>
                  {allPermissions.map(perm => (
                    <label
                      key={perm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        background: formData.permissions.includes(perm.id) ? `${formData.color}15` : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '12px' }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleSaveRole}
                >
                  {selectedRole ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
