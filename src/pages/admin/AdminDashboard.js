import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminStats from './AdminStats';
import AdminUsers from './AdminUsers';
import AdminRoles from './AdminRoles';
import AdminLogs from './AdminLogs';
import AdminSettings from './AdminSettings';
import './Admin.css';

const NAV = [
  { id: 'stats',    icon: 'ti-layout-dashboard', label: 'Vue globale' },
  { id: 'users',    icon: 'ti-users',             label: 'Utilisateurs' },
  { id: 'roles',    icon: 'ti-shield-lock',       label: 'Rôles & Permissions' },
  { id: 'logs',     icon: 'ti-list-details',      label: 'Audit Logs' },
  { id: 'settings', icon: 'ti-settings',          label: 'Paramètres' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('stats');
  const [collapsed, setCollapsed] = useState(false);

  const pages = {
    stats:    <AdminStats />,
    users:    <AdminUsers />,
    roles:    <AdminRoles />,
    logs:     <AdminLogs />,
    settings: <AdminSettings />,
  };

  return (
    <div className={`adm-root ${collapsed ? 'adm-root--collapsed' : ''}`}>
      <aside className="adm-sidebar">
        <div className="adm-sidebar-inner">
          <div className="adm-logo">
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#FF4466" strokeWidth="1.5" fill="none"/>
              <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" stroke="#FF4466" strokeWidth="0.8" fill="rgba(255,68,102,0.06)"/>
              <circle cx="18" cy="18" r="3.5" fill="#FF4466"/>
            </svg>
            {!collapsed && <span className="adm-logo-text">CYBER<strong>INSURE</strong></span>}
          </div>

          {!collapsed && (
            <div className="adm-profile">
              <div className="adm-avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="adm-profile-info">
                <span className="adm-profile-email">{user?.email}</span>
                <span className="adm-profile-role">Administrateur</span>
              </div>
            </div>
          )}

          <nav className="adm-nav">
            {NAV.map(item => (
              <button
                key={item.id}
                className={`adm-nav-btn ${active === item.id ? 'adm-nav-btn--active' : ''}`}
                onClick={() => setActive(item.id)}
                title={collapsed ? item.label : ''}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
                {active === item.id && <div className="adm-nav-indicator" />}
              </button>
            ))}
          </nav>

          <div className="adm-sidebar-footer">
            <button className="adm-collapse-btn" onClick={() => setCollapsed(c => !c)}>
              <i className={`ti ${collapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`} aria-hidden="true" />
              {!collapsed && <span>Réduire</span>}
            </button>
            <button className="adm-logout-btn" onClick={() => { logout(); navigate('/login'); }}>
              <i className="ti ti-logout" aria-hidden="true" />
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-header">
          <h1 className="adm-header-title">
            {NAV.find(n => n.id === active)?.label}
          </h1>
          <div className="adm-header-right">
            <div className="adm-status-pill">
              <span className="adm-status-dot" />
              SYSTÈME OPÉRATIONNEL
            </div>
            <span className="adm-header-date">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </header>
        <div className="adm-content">{pages[active]}</div>
      </main>
    </div>
  );
}
