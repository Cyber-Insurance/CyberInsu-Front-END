import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/admin';

export default function AdminUsers({ searchQuery, filters, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'client',
  });

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, [searchQuery, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`${API_BASE}/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Transform API response - handle both array and object with users property
      let usersArray = Array.isArray(response.data) ? response.data : response.data.users || [];
      
      console.log('Users API response:', usersArray);

      const transformedUsers = usersArray.map(u => ({
        id: u.id_user || u.id,
        email: u.email,
        name: u.name || u.email.split('@')[0],
        role: (u.role_status || u.role || '').toLowerCase(),
        status: u.status || 'active',
        verified: u.email_verified !== false,
        mfa: u.mfa_enabled === true,
        lastLogin: u.last_login ? new Date(u.last_login) : u.created_at ? new Date(u.created_at) : new Date(0) // Use epoch if no date available
      }));

      setUsers(transformedUsers);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrateur',
      assureur: 'Assureur',
      courtier: 'Courtier',
      client: 'Client',
    };
    return labels[role] || role;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({ email: '', name: '', role: 'client' });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({ email: user.email, name: user.name, role: user.role });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (selectedUser) {
        // Update existing user
        await axios.put(
          `${API_BASE}/users/${selectedUser.id}`,
          {
            email: formData.email,
            id_role: formData.role === 'admin' ? 1 : formData.role === 'assureur' ? 2 : formData.role === 'courtier' ? 3 : 4
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new user
        await axios.post(
          `${API_BASE}/users`,
          {
            email: formData.email,
            password: 'TempPassword123!@#',
            id_role: formData.role === 'admin' ? 1 : formData.role === 'assureur' ? 2 : formData.role === 'courtier' ? 3 : 4
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setShowModal(false);
      fetchUsers();
      onRefresh();
    } catch (err) {
      setError('Erreur lors de la sauvegarde de l\'utilisateur');
      console.error('Error saving user:', err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`${API_BASE}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
        onRefresh();
      } catch (err) {
        setError('Erreur lors de la suppression de l\'utilisateur');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleToggleMFA = async (id) => {
    console.log('Toggle MFA for user', id);
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchRole = !filters.role || user.role === filters.role;
    const matchStatus = !filters.status || user.status === filters.status;
    
    return matchSearch && matchRole && matchStatus;
  });

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      {error && (
        <div className="admin-alert admin-alert--error">
          <span>✗</span>
          <span>{error}</span>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Gestion des utilisateurs</h2>
          <div className="admin-section-actions">
            <button className="admin-btn admin-btn--primary" onClick={handleAddUser}>
              ➕ Ajouter utilisateur
            </button>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Vérification</th>
                  <th>MFA</th>
                  <th>Dernière connexion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: 'rgba(77,255,180,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#4DFFB4',
                        }}>
                          {user.name[0].toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: '11px' }}>{user.email}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${user.role}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${user.status}`}>
                        {user.status === 'active' ? 'Actif' : user.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${user.verified ? 'admin-badge--verified' : 'admin-badge--unverified'}`}>
                        {user.verified ? '✓ Vérifié' : 'Non vérifié'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleMFA(user.id)}
                        className="admin-btn admin-btn--small"
                        style={{
                          background: user.mfa ? 'rgba(77,255,180,0.1)' : 'rgba(255,68,102,0.1)',
                          borderColor: user.mfa ? 'rgba(77,255,180,0.2)' : 'rgba(255,68,102,0.2)',
                          color: user.mfa ? '#4DFFB4' : '#FF4466',
                        }}
                      >
                        {user.mfa ? '🔐 Activé' : '⚠️ Inactif'}
                      </button>
                    </td>
                    <td>{formatDate(user.lastLogin)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="admin-btn admin-btn--small"
                          onClick={() => handleEditUser(user)}
                          style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', borderColor: 'rgba(0,212,255,0.2)' }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-icon">👤</div>
            <div className="admin-empty-title">Aucun utilisateur trouvé</div>
            <div className="admin-empty-description">
              {searchQuery || Object.keys(filters).length > 0
                ? 'Modifiez vos critères de recherche et de filtrage.'
                : 'Créez votre premier utilisateur pour commencer.'}
            </div>
            <button className="admin-btn admin-btn--primary" onClick={handleAddUser}>
              ➕ Créer utilisateur
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="admin-modal-header">
              {selectedUser ? 'Modifier utilisateur' : 'Ajouter utilisateur'}
            </h2>

            <form className="admin-form">
              <div className="admin-form-group">
                <label className="admin-form-label">Nom complet</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Email</label>
                <input
                  type="email"
                  className="admin-form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean@example.com"
                  disabled={!!selectedUser}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Rôle</label>
                <select
                  className="admin-form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="client">Client</option>
                  <option value="courtier">Courtier</option>
                  <option value="assureur">Assureur</option>
                  <option value="admin">Administrateur</option>
                </select>
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
                  onClick={handleSaveUser}
                >
                  {selectedUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
