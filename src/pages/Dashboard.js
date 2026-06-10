import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const ROLE_CONFIG = {
  admin: {
    label: 'Administrateur',
    color: '#FF4466',
    nav: [
      { icon: '⬡', label: 'Vue globale', id: 'overview' },
      { icon: '◈', label: 'Utilisateurs', id: 'users' },
      { icon: '◉', label: 'Rôles & Permissions', id: 'roles' },
      { icon: '▣', label: 'Audit Logs', id: 'audit' },
      { icon: '◎', label: 'Paramètres', id: 'settings' },
    ],
    stats: [
      { label: 'Utilisateurs', value: '0', trend: '+0', color: '#4DFFB4' },
      { label: 'Dossiers total', value: '0', trend: '+0', color: '#00D4FF' },
      { label: 'Analyses IA', value: '0', trend: '+0', color: '#FFB347' },
      { label: 'Alertes', value: '0', trend: '0', color: '#FF4466' },
    ],
  },
  assureur: {
    label: 'Assureur',
    color: '#00D4FF',
    nav: [
      { icon: '⬡', label: 'Tableau de bord', id: 'overview' },
      { icon: '◈', label: 'Dossiers', id: 'dossiers' },
      { icon: '◉', label: 'Scores de risque', id: 'scores' },
      { icon: '▣', label: 'Valider devis', id: 'devis' },
    ],
    stats: [
      { label: 'Dossiers reçus', value: '0', trend: '+0', color: '#4DFFB4' },
      { label: 'À valider', value: '0', trend: '+0', color: '#FFB347' },
      { label: 'Validés', value: '0', trend: '+0', color: '#00D4FF' },
      { label: 'Refusés', value: '0', trend: '0', color: '#FF4466' },
    ],
  },
  courtier: {
    label: 'Courtier',
    color: '#4DFFB4',
    nav: [
      { icon: '⬡', label: 'Tableau de bord', id: 'overview' },
      { icon: '◈', label: 'Mes dossiers', id: 'dossiers' },
      { icon: '◉', label: 'Nouveau dossier', id: 'new' },
      { icon: '◎', label: 'Scores', id: 'scores' },
      { icon: '▣', label: 'Devis', id: 'devis' },
    ],
    stats: [
      { label: 'Dossiers actifs', value: '0', trend: '+0', color: '#4DFFB4' },
      { label: 'En analyse', value: '0', trend: '+0', color: '#00D4FF' },
      { label: 'Devis en attente', value: '0', trend: '+0', color: '#FFB347' },
      { label: 'Complétés', value: '0', trend: '0', color: '#9B8FFF' },
    ],
  },
  client: {
    label: 'Client',
    color: '#9B8FFF',
    nav: [
      { icon: '⬡', label: 'Mon espace', id: 'overview' },
      { icon: '◈', label: 'Questionnaire', id: 'questionnaire' },
      { icon: '◉', label: 'Mes documents', id: 'documents' },
      { icon: '◎', label: 'Mon score', id: 'score' },
      { icon: '▣', label: 'Recommandations', id: 'recommandations' },
    ],
    stats: [
      { label: 'Score de risque', value: '—', trend: '', color: '#9B8FFF' },
      { label: 'Documents', value: '0', trend: '+0', color: '#4DFFB4' },
      { label: 'Recommandations', value: '0', trend: '+0', color: '#FFB347' },
      { label: 'Risque résiduel', value: '—', trend: '', color: '#FF4466' },
    ],
  },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return null;

  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.courtier;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`dash ${sidebarOpen ? 'dash--open' : ''}`}>
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <div className="dash-logo">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#4DFFB4" strokeWidth="1.5" fill="none"/>
              <circle cx="18" cy="18" r="4" fill="#4DFFB4"/>
            </svg>
            {sidebarOpen && <span className="dash-logo-text">CYBER<strong>INSURE</strong></span>}
          </div>

          {sidebarOpen && (
            <div className="dash-user-pill" style={{ borderColor: config.color + '40', background: config.color + '08' }}>
              <div className="dash-user-avatar" style={{ background: config.color + '20', color: config.color }}>
                {user.email[0].toUpperCase()}
              </div>
              <div className="dash-user-info">
                <span className="dash-user-email">{user.email}</span>
                <span className="dash-user-role" style={{ color: config.color }}>{config.label}</span>
              </div>
            </div>
          )}

          <nav className="dash-nav">
            {config.nav.map(item => (
              <button
                key={item.id}
                className={`dash-nav-item ${activeNav === item.id ? 'dash-nav-item--active' : ''}`}
                onClick={() => {
                  if (user.role === 'admin' && item.id !== 'overview') {
                    navigate(`/admin?tab=${item.id}`);
                  } else {
                    setActiveNav(item.id);
                  }
                }}
                style={activeNav === item.id ? { borderColor: config.color + '50', background: config.color + '10', color: config.color } : {}}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="dash-nav-label">{item.label}</span>}
                {activeNav === item.id && <div className="dash-nav-indicator" style={{ background: config.color }} />}
              </button>
            ))}
          </nav>
        </div>

        <div className="dash-sidebar-bottom">
          {sidebarOpen && user.mfa_enabled === false && (
            <div className="dash-mfa-alert">
              <span>⚠</span>
              <span>MFA non activé</span>
            </div>
          )}
          <button className="dash-logout" onClick={handleLogout}>
            <svg viewBox="0 0 20 20" fill="none"><path d="M13 4l4 6-4 6M17 10H7M10 4H4a1 1 0 00-1 1v10a1 1 0 001 1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        {/* Header */}
        <header className="dash-header">
          <div className="dash-header-left">
            <button className="dash-toggle" onClick={() => setSidebarOpen(s => !s)}>
              <span /><span /><span />
            </button>
            <div>
              <h1 className="dash-page-title">
                {config.nav.find(n => n.id === activeNav)?.label || 'Tableau de bord'}
              </h1>
              <p className="dash-page-sub">
                Connecté en tant que <span style={{ color: config.color }}>{config.label}</span>
              </p>
            </div>
          </div>
          <div className="dash-header-right">
            <div className="dash-status">
              <span className="dash-status-dot" />
              <span>SYSTÈME OPÉRATIONNEL</span>
            </div>
            <div className="dash-clock">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="dash-content">
          {/* Stats */}
          <div className="dash-stats">
            {config.stats.map((stat, i) => (
              <div key={i} className="dash-stat" style={{ '--stat-color': stat.color }}>
                <div className="dash-stat-top">
                  <span className="dash-stat-label">{stat.label}</span>
                  {stat.trend && <span className="dash-stat-trend">{stat.trend}</span>}
                </div>
                <span className="dash-stat-value">{stat.value}</span>
                <div className="dash-stat-bar">
                  <div className="dash-stat-bar-fill" />
                </div>
              </div>
            ))}
          </div>

          {/* Permissions */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Permissions actives</h2>
              <span className="dash-section-count">{user.permissions?.length || 0}</span>
            </div>
            <div className="dash-perms">
              {user.permissions?.length > 0 ? user.permissions.map((p, i) => (
                <div key={i} className="dash-perm" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="dash-perm-dot" style={{ background: config.color }} />
                  <span>{p}</span>
                </div>
              )) : (
                <p className="dash-empty">Aucune permission assignée — contactez un administrateur.</p>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Sécurité du compte</h2>
            </div>
            <div className="dash-security">
              <div className="dash-sec-row">
                <div className="dash-sec-info">
                  <span className="dash-sec-label">Email</span>
                  <span className="dash-sec-value">{user.email}</span>
                </div>
                <div className="dash-sec-badge" style={{ color: '#4DFFB4', background: 'rgba(77,255,180,0.08)', borderColor: 'rgba(77,255,180,0.2)' }}>VÉRIFIÉ</div>
              </div>
              <div className="dash-sec-row">
                <div className="dash-sec-info">
                  <span className="dash-sec-label">Rôle</span>
                  <span className="dash-sec-value">{config.label}</span>
                </div>
                <div className="dash-sec-badge" style={{ color: config.color, background: config.color + '15', borderColor: config.color + '30' }}>{user.role.toUpperCase()}</div>
              </div>
              <div className="dash-sec-row">
                <div className="dash-sec-info">
                  <span className="dash-sec-label">MFA (Google Authenticator)</span>
                  <span className="dash-sec-value">{user.mfa_enabled ? 'Actif depuis votre configuration' : 'Non configuré'}</span>
                </div>
                <div className="dash-sec-badge" style={user.mfa_enabled
                  ? { color: '#4DFFB4', background: 'rgba(77,255,180,0.08)', borderColor: 'rgba(77,255,180,0.2)' }
                  : { color: '#FFB347', background: 'rgba(255,179,71,0.08)', borderColor: 'rgba(255,179,71,0.2)' }}>
                  {user.mfa_enabled ? '✓ ACTIVÉ' : '⚠ INACTIF'}
                </div>
              </div>
            </div>
          </div>

          {/* Coming soon module */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Modules</h2>
            </div>
            <div className="dash-modules">
              {config.nav.filter(n => n.id !== 'overview').map((mod, i) => (
                <div key={i} className="dash-module" onClick={() => setActiveNav(mod.id)}>
                  <span className="dash-module-icon" style={{ color: config.color }}>{mod.icon}</span>
                  <span className="dash-module-label">{mod.label}</span>
                  <span className="dash-module-status">À venir</span>
                  <svg className="dash-module-arrow" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
