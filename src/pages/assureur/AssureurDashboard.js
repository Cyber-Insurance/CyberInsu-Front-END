import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AssureurStats from './AssureurStats';
import AssureurDossiers from './AssureurDossiers';
import AssureurDevis from './AssureurDevis';
import MFASetupModal from '../../components/MFASetupModal';
import './Assureur.css';

const NAV = [
  { id: 'stats',    icon: 'ti-layout-dashboard', label: 'Tableau de bord' },
  { id: 'dossiers', icon: 'ti-folder-open',       label: 'Dossiers' },
  { id: 'devis',    icon: 'ti-file-check',        label: 'Valider devis' },
  { id: 'securite', icon: 'ti-shield',            label: 'Sécurité' },
];

export default function AssureurDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('stats');
  const [collapsed, setCollapsed] = useState(false);
  const [mfaModal, setMfaModal] = useState(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const renderPage = () => {
    switch (active) {
      case 'stats':    return <AssureurStats />;
      case 'dossiers': return <AssureurDossiers />;
      case 'devis':    return <AssureurDevis />;
      case 'securite': return <AssureurSecurite user={user} onOpenMfa={setMfaModal} />;
      default:         return <AssureurStats />;
    }
  };

  return (
    <>
    {mfaModal && (
      <MFASetupModal
        mode={mfaModal}
        onClose={() => setMfaModal(null)}
        onSuccess={() => refreshUser()}
      />
    )}
    <div className={`as-root ${collapsed ? 'as-root--collapsed' : ''}`}>
      <aside className="as-sidebar">
        <div className="as-sidebar-inner">
          <div className="as-logo">
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#00D4FF" strokeWidth="1.5" fill="none"/>
              <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" stroke="#00D4FF" strokeWidth="0.8" fill="rgba(0,212,255,0.06)"/>
              <circle cx="18" cy="18" r="3.5" fill="#00D4FF"/>
            </svg>
            {!collapsed && <span className="as-logo-text">CYBER<strong>INSURE</strong></span>}
          </div>

          {!collapsed && (
            <div className="as-profile">
              <div className="as-avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="as-profile-info">
                <span className="as-profile-email">{user?.email}</span>
                <span className="as-profile-role">Assureur</span>
              </div>
            </div>
          )}

          <nav className="as-nav">
            {NAV.map(item => (
              <button
                key={item.id}
                className={`as-nav-btn ${active === item.id ? 'as-nav-btn--active' : ''}`}
                onClick={() => setActive(item.id)}
                title={collapsed ? item.label : ''}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
                {active === item.id && <div className="as-nav-indicator" />}
              </button>
            ))}
          </nav>

          <div className="as-sidebar-footer">
            <button className="as-collapse-btn" onClick={() => setCollapsed(c => !c)} title="Réduire">
              <i className={`ti ${collapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`} aria-hidden="true" />
            </button>
            <button className="as-logout-btn" onClick={handleLogout} title="Déconnexion">
              <i className="ti ti-logout" aria-hidden="true" />
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="as-main">
        <header className="as-header">
          <div className="as-header-left">
            <h1 className="as-header-title">
              {NAV.find(n => n.id === active)?.label}
            </h1>
          </div>
          <div className="as-header-right">
            <div className="as-status-pill">
              <span className="as-status-dot" />
              SYSTÈME OPÉRATIONNEL
            </div>
          </div>
        </header>

        <div className="as-content">
          {renderPage()}
        </div>
      </main>
    </div>
    </>
  );
}

function AssureurSecurite({ user, onOpenMfa }) {
  return (
    <div className="as-page fade-in">
      <div className="as-panel">
        <div className="as-panel-header">
          <span className="as-panel-title">Sécurité du compte</span>
        </div>

        <div className="as-info-row">
          <span className="as-info-label">Email</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="as-info-value">{user?.email}</span>
            <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: '700', color: '#4DFFB4', background: 'rgba(77,255,180,0.08)', border: '1px solid rgba(77,255,180,0.2)' }}>VÉRIFIÉ</span>
          </div>
        </div>

        <div className="as-info-row">
          <span className="as-info-label">Rôle</span>
          <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: '700', color: '#00D4FF', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>ASSUREUR</span>
        </div>

        <div className="as-info-row">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span className="as-info-label">Authentification à deux facteurs (MFA)</span>
            <span className="as-info-value" style={{ fontSize: '12px', color: 'var(--c-text2)' }}>
              {user?.mfa_enabled ? 'Google Authenticator actif — code requis à chaque connexion' : 'Non configuré — votre compte n\'est pas protégé par un second facteur'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={user?.mfa_enabled
              ? { padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: '700', color: '#4DFFB4', background: 'rgba(77,255,180,0.08)', border: '1px solid rgba(77,255,180,0.2)', whiteSpace: 'nowrap' }
              : { padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontFamily: 'var(--f-mono)', fontWeight: '700', color: '#FFB347', background: 'rgba(255,179,71,0.08)', border: '1px solid rgba(255,179,71,0.2)', whiteSpace: 'nowrap' }}>
              {user?.mfa_enabled ? '✓ ACTIVÉ' : '⚠ INACTIF'}
            </span>
            <button
              onClick={() => onOpenMfa(user?.mfa_enabled ? 'disable' : 'setup')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: '1px solid',
                fontSize: '12px',
                fontFamily: 'var(--f-mono)',
                letterSpacing: '0.05em',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                ...(user?.mfa_enabled
                  ? { color: '#FF4466', background: 'rgba(255,68,102,0.08)', borderColor: 'rgba(255,68,102,0.25)' }
                  : { color: '#4DFFB4', background: 'rgba(77,255,180,0.08)', borderColor: 'rgba(77,255,180,0.2)' }
                ),
              }}
            >
              {user?.mfa_enabled ? 'DÉSACTIVER' : 'ACTIVER'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
