import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clientAPI } from '../../services/clientAPI';
import ClientOverview from './ClientOverview';
import ClientQuestionnaire from './ClientQuestionnaire';
import ClientDocuments from './ClientDocuments';
import ClientProfile from './ClientProfile';
import './Client.css';

const NAV = [
  { id: 'overview',      icon: 'ti ti-layout-dashboard', label: 'Mon dossier' },
  { id: 'questionnaire', icon: 'ti ti-clipboard-list',   label: 'Questionnaire' },
  { id: 'documents',     icon: 'ti ti-file-upload',      label: 'Documents' },
  { id: 'devis',         icon: 'ti ti-file-invoice',     label: 'Mon devis' },
  { id: 'profil',        icon: 'ti ti-user-circle',      label: 'Mon profil' },
];

const PAGE_TITLES = {
  overview:      { title: 'Mon dossier',            sub: 'Suivi de votre dossier d\'assurance' },
  questionnaire: { title: 'Questionnaire de risque', sub: 'Évaluez votre exposition cyber' },
  documents:     { title: 'Documents',               sub: 'Vos pièces justificatives' },
  devis:         { title: 'Mon devis',               sub: 'Votre proposition d\'assurance' },
  profil:        { title: 'Mon profil',              sub: 'Informations et sécurité du compte' },
};

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(true);
  const [devis, setDevis] = useState(null);

  const loadDossier = () => {
    clientAPI.getDossier()
      .then((r) => setDossier(r.data))
      .catch(() => {})
      .finally(() => setDossierLoading(false));
  };

  useEffect(() => { loadDossier(); }, []);

  useEffect(() => {
    if (active === 'devis') {
      clientAPI.getDevis().then((r) => setDevis(r.data)).catch(() => {});
    }
  }, [active]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const { title, sub } = PAGE_TITLES[active];

  return (
    <div className={`cl-root ${collapsed ? 'cl-root--collapsed' : ''}`}>
      <aside className="cl-sidebar">
        <div className="cl-sidebar-inner">
          {/* Logo */}
          <div className="cl-logo" onClick={() => setActive('overview')}>
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
              <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" stroke="#A78BFA" strokeWidth="0.8" fill="rgba(167,139,250,0.06)"/>
              <circle cx="18" cy="18" r="3.5" fill="#A78BFA"/>
            </svg>
            {!collapsed && <span className="cl-logo-text">CYBER<strong>INSURE</strong></span>}
          </div>

          {/* Profile */}
          {!collapsed && user && (
            <div className="cl-profile">
              <div className="cl-avatar">{user.email?.[0]?.toUpperCase()}</div>
              <div className="cl-profile-info">
                <span className="cl-profile-email">{user.email}</span>
                <span className="cl-profile-role">CLIENT</span>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="cl-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`cl-nav-btn ${active === item.id ? 'cl-nav-btn--active' : ''}`}
                onClick={() => setActive(item.id)}
                title={collapsed ? item.label : ''}
              >
                {active === item.id && <div className="cl-nav-indicator" />}
                <i className={item.icon} aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="cl-sidebar-footer">
            <button className="cl-logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M13 4l4 6-4 6M17 10H7M10 4H4a1 1 0 00-1 1v10a1 1 0 001 1h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="cl-main">
        <header className="cl-header">
          <div className="cl-header-left">
            <button className="cl-toggle" onClick={() => setCollapsed((c) => !c)}>
              <span/><span/><span/>
            </button>
            <div>
              <h1 className="cl-page-title">{title}</h1>
              {dossier && <p className="cl-page-sub">{dossier.company}</p>}
            </div>
          </div>
          <div className="cl-header-right">
            {dossier?.status && (
              <div className="cl-status">
                <span className="cl-status-dot" />
                {dossier.status.toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <div className="cl-content">
          <div className="cl-page fade-in">
            {active === 'overview' && (
              dossierLoading
                ? <div className="cl-loader"><div className="cl-spinner" /></div>
                : dossier
                  ? <ClientOverview dossier={dossier} onNavigate={setActive} />
                  : (
                    <div className="cl-empty">
                      <i className="ti ti-folder-off" style={{ fontSize: 32 }} />
                      <p>Aucun dossier associé à votre compte.</p>
                      <p style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 4 }}>Contactez votre courtier.</p>
                    </div>
                  )
            )}

            {active === 'questionnaire' && (
              <ClientQuestionnaire
                dossier={dossier}
                onSuccess={() => { loadDossier(); setActive('overview'); }}
              />
            )}

            {active === 'documents' && <ClientDocuments />}

            {active === 'profil' && <ClientProfile dossier={dossier} />}

            {active === 'devis' && (
              !devis
                ? <div className="cl-loader"><div className="cl-spinner" /></div>
                : devis.total === 0
                  ? (
                    <div className="cl-empty">
                      <i className="ti ti-file-off" style={{ fontSize: 32 }} />
                      <p>Aucun devis disponible pour le moment.</p>
                    </div>
                  )
                  : (
                    <div className="cl-page">
                      {devis.devis.map((dv) => (
                        <div key={dv.id} className="cl-devis-card">
                          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--c-text3)', fontWeight: 600, marginBottom: 12 }}>
                            DEVIS #{dv.id} · <span style={{ fontFamily: 'var(--f-mono)' }}>{dv.date}</span>
                          </div>
                          <div className="cl-devis-prime">
                            {dv.prime?.toLocaleString('fr-FR')}<span> €/an</span>
                          </div>
                          <div className="cl-devis-label">PRIME ANNUELLE ESTIMÉE</div>
                          <span className={`cl-badge cl-badge--${dv.status}`}>{dv.status}</span>
                          {dv.motif && (
                            <div className="cl-motif" style={{ marginTop: 16 }}>
                              <i className="ti ti-info-circle" style={{ fontSize: 16, flexShrink: 0 }} />
                              {dv.motif}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
