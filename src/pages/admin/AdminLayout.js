import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const NAV = [
  { id: 'overview', path: '/admin',        label: 'Vue globale',         icon: 'ti ti-layout-dashboard' },
  { id: 'users',    path: '/admin/users',  label: 'Utilisateurs',        icon: 'ti ti-users' },
  { id: 'roles',    path: '/admin/roles',  label: 'Rôles & Permissions', icon: 'ti ti-lock' },
  { id: 'audit',    path: '/admin/audit',  label: 'Audit Logs',          icon: 'ti ti-list-search' },
];

export default function AdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`adm-root ${collapsed ? 'adm-root--collapsed' : ''}`}>
      <aside className="adm-sidebar">
        <div className="adm-sidebar-top">
          <div className="adm-logo" onClick={() => navigate('/admin')}>
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#FF4466" strokeWidth="1.5" fill="none"/>
              <circle cx="18" cy="18" r="4" fill="#FF4466"/>
            </svg>
            {!collapsed && <span className="adm-logo-text">CYBER<strong>INSURE</strong></span>}
          </div>

          {!collapsed && (
            <div className="adm-role-badge">
              <span className="adm-role-dot" />
              <span>ADMIN PANEL</span>
            </div>
          )}

          <nav className="adm-nav">
            {NAV.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.id}
                  className={`adm-nav-btn ${active ? 'adm-nav-btn--active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : ''}
                >
                  {active && <div className="adm-nav-indicator" />}
                  <i className={item.icon} aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="adm-sidebar-bot">
          {!collapsed && user && (
            <div className="adm-user">
              <div className="adm-user-av">{user.email[0].toUpperCase()}</div>
              <div className="adm-user-info">
                <span className="adm-user-email">{user.email}</span>
                <span className="adm-user-role">Administrateur</span>
              </div>
            </div>
          )}
          <button className="adm-logout" onClick={() => { logout(); navigate('/login'); }}>
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <path d="M13 4l4 6-4 6M17 10H7M10 4H4a1 1 0 00-1 1v10a1 1 0 001 1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <header className="adm-header">
          <div className="adm-header-left">
            <button className="adm-toggle" onClick={() => setCollapsed(c => !c)}>
              <span/><span/><span/>
            </button>
            <div>
              <h1 className="adm-page-title">{title}</h1>
              {subtitle && <p className="adm-page-sub">{subtitle}</p>}
            </div>
          </div>
          <div className="adm-header-right">
            <div className="adm-status">
              <span className="adm-status-dot" />
              SYSTÈME OPÉRATIONNEL
            </div>
          </div>
        </header>
        <div className="adm-content">{children}</div>
      </main>
    </div>
  );
}
