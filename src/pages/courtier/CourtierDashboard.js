import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courtierAPI } from '../../services/courtierAPI';
import CourtierStats from './CourtierStats';
import CourtierDossiers from './CourtierDossiers';
import CourtierClients from './CourtierClients';
import './Courtier.css';

const NAV = [
  { id: 'stats',    icon: 'ti ti-layout-dashboard', label: 'Tableau de bord' },
  { id: 'dossiers', icon: 'ti ti-folder-open',       label: 'Dossiers' },
  { id: 'clients',  icon: 'ti ti-users',             label: 'Clients' },
];

const PAGE_TITLES = {
  stats:    { title: 'Tableau de bord', sub: 'Vue d\'ensemble de votre portefeuille' },
  dossiers: { title: 'Dossiers',        sub: 'Gestion de vos dossiers clients' },
  clients:  { title: 'Clients',         sub: 'Vos clients associés' },
};

export default function CourtierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('stats');
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    courtierAPI.getStats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const { title, sub } = PAGE_TITLES[active];

  return (
    <div className={`co-root ${collapsed ? 'co-root--collapsed' : ''}`}>
      <aside className="co-sidebar">
        <div className="co-sidebar-inner">
          {/* Logo */}
          <div className="co-logo" onClick={() => setActive('stats')}>
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#4DFFB4" strokeWidth="1.5" fill="none"/>
              <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" stroke="#4DFFB4" strokeWidth="0.8" fill="rgba(77,255,180,0.06)"/>
              <circle cx="18" cy="18" r="3.5" fill="#4DFFB4"/>
            </svg>
            {!collapsed && <span className="co-logo-text">CYBER<strong>INSURE</strong></span>}
          </div>

          {/* Profile */}
          {!collapsed && user && (
            <div className="co-profile">
              <div className="co-avatar">{user.email?.[0]?.toUpperCase()}</div>
              <div className="co-profile-info">
                <span className="co-profile-email">{user.email}</span>
                <span className="co-profile-role">COURTIER</span>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="co-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`co-nav-btn ${active === item.id ? 'co-nav-btn--active' : ''}`}
                onClick={() => setActive(item.id)}
                title={collapsed ? item.label : ''}
              >
                {active === item.id && <div className="co-nav-indicator" />}
                <i className={item.icon} aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="co-sidebar-footer">
            <button className="co-logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M13 4l4 6-4 6M17 10H7M10 4H4a1 1 0 00-1 1v10a1 1 0 001 1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="co-main">
        <header className="co-header">
          <div className="co-header-left">
            <button className="co-toggle" onClick={() => setCollapsed((c) => !c)}>
              <span/><span/><span/>
            </button>
            <div>
              <h1 className="co-page-title">{title}</h1>
              {sub && <p className="co-page-sub">{sub}</p>}
            </div>
          </div>
          <div className="co-header-right">
            {active === 'stats' && !statsLoading && stats && (
              <div className="co-status">
                <span className="co-status-dot" />
                SCORE MOY. {stats.score_moyen}
              </div>
            )}
          </div>
        </header>

        <div className="co-content">
          <div className="co-page fade-in">
            {active === 'stats' && (
              statsLoading
                ? <div className="co-loader"><div className="co-spinner" /></div>
                : <CourtierStats stats={stats} />
            )}
            {active === 'dossiers' && <CourtierDossiers />}
            {active === 'clients'  && <CourtierClients />}
          </div>
        </div>
      </main>
    </div>
  );
}
