import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminUsers from '../components/Admin/AdminUsers';
import AdminRoles from '../components/Admin/AdminRoles';
import AdminAudit from '../components/Admin/AdminAudit';
import AdminSettings from '../components/Admin/AdminSettings';
import AdminOverview from '../components/Admin/AdminOverview';
import './Admin.css';

const ADMIN_NAV = [
  { icon: '⬡', label: 'Vue globale', id: 'overview' },
  { icon: '◈', label: 'Utilisateurs', id: 'users' },
  { icon: '◉', label: 'Rôles & Permissions', id: 'roles' },
  { icon: '▣', label: 'Audit Logs', id: 'audit' },
  { icon: '◎', label: 'Paramètres', id: 'settings' },
];

const COLOR = '#FF4466';

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const handleFilterChange = (filterKey, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setSearchQuery('');
    setSelectedFilters({});
  };

  const renderContent = () => {
    const key = `${activeTab}-${refreshKey}`;
    
    switch (activeTab) {
      case 'overview':
        return <AdminOverview key={key} />;
      case 'users':
        return <AdminUsers key={key} searchQuery={searchQuery} filters={selectedFilters} onRefresh={handleRefresh} />;
      case 'roles':
        return <AdminRoles key={key} onRefresh={handleRefresh} />;
      case 'audit':
        return <AdminAudit key={key} filters={selectedFilters} />;
      case 'settings':
        return <AdminSettings key={key} />;
      default:
        return <AdminOverview />;
    }
  };

  const renderFilters = () => {
    if (activeTab === 'users') {
      return (
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            className="admin-filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="admin-filter-select"
            value={selectedFilters.role || ''}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Administrateur</option>
            <option value="assureur">Assureur</option>
            <option value="courtier">Courtier</option>
            <option value="client">Client</option>
          </select>
          <select
            className="admin-filter-select"
            value={selectedFilters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>
      );
    } else if (activeTab === 'audit') {
      return (
        <div className="admin-filters">
          <select
            className="admin-filter-select"
            value={selectedFilters.action || ''}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Toutes les actions</option>
            <option value="login">Connexion</option>
            <option value="create">Création</option>
            <option value="update">Modification</option>
            <option value="delete">Suppression</option>
          </select>
          <input
            type="date"
            className="admin-filter-select"
            value={selectedFilters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
          <input
            type="date"
            className="admin-filter-select"
            value={selectedFilters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
      );
    }
    return null;
  };

  if (!user) return null;

  return (
    <div className={`admin ${sidebarOpen ? 'admin--open' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-logo">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#4DFFB4" strokeWidth="1.5" fill="none"/>
              <circle cx="18" cy="18" r="4" fill="#4DFFB4"/>
            </svg>
            {sidebarOpen && <span className="admin-logo-text">CYBER<strong>INSURE</strong></span>}
          </div>

          {sidebarOpen && (
            <div className="admin-user-pill" style={{ borderColor: COLOR + '40', background: COLOR + '08' }}>
              <div className="admin-user-avatar" style={{ background: COLOR + '20', color: COLOR }}>
                {user.email[0].toUpperCase()}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-email">{user.email}</span>
                <span className="admin-user-role" style={{ color: COLOR }}>Administrateur</span>
              </div>
            </div>
          )}

          <nav className="admin-nav">
            {ADMIN_NAV.map(item => (
              <button
                key={item.id}
                className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-item--active' : ''}`}
                onClick={() => handleTabChange(item.id)}
                style={activeTab === item.id ? { borderColor: COLOR + '50', background: COLOR + '10', color: COLOR } : {}}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
                {activeTab === item.id && <div className="admin-nav-indicator" style={{ background: COLOR }} />}
              </button>
            ))}
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          {sidebarOpen && user.mfa_enabled === false && (
            <div className="admin-mfa-alert">
              <span>⚠</span>
              <span>MFA non activé</span>
            </div>
          )}
          <button className="admin-logout" onClick={handleLogout}>
            <svg viewBox="0 0 20 20" fill="none"><path d="M13 4l4 6-4 6M17 10H7M10 4H4a1 1 0 00-1 1v10a1 1 0 001 1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-toggle" onClick={() => setSidebarOpen(s => !s)}>
              <span /><span /><span />
            </button>
            <div>
              <h1 className="admin-page-title">
                {ADMIN_NAV.find(n => n.id === activeTab)?.label || 'Tableau de bord administrateur'}
              </h1>
              <p className="admin-page-sub">
                Connecté en tant que <span style={{ color: COLOR }}>Administrateur</span>
              </p>
            </div>
          </div>
          <div className="admin-header-right">
            <div className="admin-status">
              <span className="admin-status-dot" />
              <span>SYSTÈME OPÉRATIONNEL</span>
            </div>
            <div className="admin-clock">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Filters */}
        {renderFilters()}

        {/* Content */}
        <div className="admin-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
