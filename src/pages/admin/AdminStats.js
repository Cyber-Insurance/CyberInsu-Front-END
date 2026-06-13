import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminAPI';

const MOCK = {
  total_users: 12,
  mfa_enabled_count: 7,
  total_audit_logs: 348,
  users_by_role: { admin: 1, assureur: 2, courtier: 6, client: 3 },
  recent_actions: [
    { action: 'login',        user_email: 'admin@cyber.fr',    created_at: '2026-06-01T14:32:00' },
    { action: 'create_user',  user_email: 'admin@cyber.fr',    created_at: '2026-06-01T14:28:00' },
    { action: 'login',        user_email: 'courtier@cyber.fr', created_at: '2026-06-01T13:55:00' },
    { action: 'mfa_verified', user_email: 'assureur@cyber.fr', created_at: '2026-06-01T13:10:00' },
    { action: 'register',     user_email: 'client@cyber.fr',   created_at: '2026-06-01T12:44:00' },
  ],
};

const ROLE_COLOR = { admin: '#FF4466', assureur: '#00D4FF', courtier: '#4DFFB4', client: '#A78BFA' };
const ACTION_CFG = {
  login:               { icon: 'ti-login',       color: '#4DFFB4', label: 'Connexion' },
  register:            { icon: 'ti-user-plus',   color: '#00D4FF', label: 'Inscription' },
  create_user:         { icon: 'ti-user-plus',   color: '#A78BFA', label: 'Créer utilisateur' },
  update_user:         { icon: 'ti-edit',        color: '#FFB347', label: 'Modifier utilisateur' },
  delete_user:         { icon: 'ti-trash',       color: '#FF4466', label: 'Supprimer utilisateur' },
  mfa_setup:           { icon: 'ti-shield',      color: '#FFB347', label: 'Config MFA' },
  mfa_verified:        { icon: 'ti-shield-check',color: '#4DFFB4', label: 'MFA vérifié' },
  update_role_permissions: { icon: 'ti-lock',    color: '#A78BFA', label: 'Modif permissions' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

const STATUS_COLOR = { ok: '#4DFFB4', warn: '#FFB347', error: '#FF4466', loading: 'var(--c-text3)' };

function HealthCard({ label, icon, status, value }) {
  const color = STATUS_COLOR[status] ?? STATUS_COLOR.loading;
  return (
    <div className="adm-health-card">
      <div className="adm-health-left">
        <div className={`adm-health-dot ${status !== 'loading' ? `adm-health-dot--${status}` : ''}`}
             style={status === 'loading' ? { background: 'var(--c-border2)' } : {}} />
        <i className={`ti ${icon}`} style={{ fontSize: 16, color }} aria-hidden="true" />
        <span className="adm-health-label">{label}</span>
      </div>
      <span className="adm-health-val" style={{ color, fontFamily: 'var(--f-mono)' }}>{value}</span>
    </div>
  );
}

export default function AdminStats() {
  const [stats,   setStats]   = useState(null);
  const [health,  setHealth]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(MOCK))
      .finally(() => setLoading(false));

    const t0 = performance.now();
    adminAPI.getHealth()
      .then(r => {
        const apiMs = Math.round(performance.now() - t0);
        setHealth({ ...r.data, api: { status: apiMs < 300 ? 'ok' : apiMs < 800 ? 'warn' : 'error', value: apiMs } });
      })
      .catch(() => setHealth(null));
  }, []);

  const d = stats || MOCK;
  const mfaPct = d.total_users > 0 ? Math.round((d.mfa_enabled_count / d.total_users) * 100) : 0;

  const CARDS = [
    { label: 'Utilisateurs',  value: d.total_users,         icon: 'ti-users',          color: '#4DFFB4' },
    { label: 'MFA activé',    value: d.mfa_enabled_count,   icon: 'ti-shield-check',   color: '#00D4FF' },
    { label: 'Audit logs',    value: d.total_audit_logs,    icon: 'ti-list-details',   color: '#A78BFA' },
    { label: 'Rôles',         value: Object.keys(d.users_by_role || {}).length, icon: 'ti-shield-lock', color: '#FFB347' },
  ];

  if (loading) return <div className="adm-loader"><div className="adm-spinner" /></div>;

  return (
    <div className="adm-page fade-in">
      {/* KPIs */}
      <div className="adm-kpi-grid">
        {CARDS.map((c, i) => (
          <div key={i} className="adm-kpi-card" style={{ '--k': c.color }}>
            <div className="adm-kpi-top">
              <i className={`ti ${c.icon}`} style={{ color: c.color }} aria-hidden="true" />
              <span className="adm-kpi-label">{c.label}</span>
            </div>
            <div className="adm-kpi-value">{c.value}</div>
            <div className="adm-kpi-bar"><div className="adm-kpi-bar-fill" /></div>
          </div>
        ))}
      </div>

      <div className="adm-two-col">
        {/* Répartition par rôle */}
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2 className="adm-panel-title">
              <i className="ti ti-chart-pie" style={{ marginRight: 6, color: '#FF4466' }} aria-hidden="true" />
              Utilisateurs par rôle
            </h2>
          </div>
          <div className="adm-roles-chart">
            {Object.entries(d.users_by_role || {}).map(([role, count]) => {
              const pct = d.total_users > 0 ? (count / d.total_users * 100).toFixed(1) : 0;
              const col = ROLE_COLOR[role] || '#888';
              return (
                <div key={role} className="adm-role-row">
                  <div className="adm-role-info">
                    <span className="adm-role-dot" style={{ background: col }} />
                    <span className="adm-role-name">{role}</span>
                    <span className="adm-role-count">{count}</span>
                  </div>
                  <div className="adm-role-bar-wrap">
                    <div className="adm-role-bar">
                      <div className="adm-role-fill" style={{ width: `${pct}%`, background: col }} />
                    </div>
                    <span className="adm-role-pct" style={{ color: col }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MFA */}
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2 className="adm-panel-title">
              <i className="ti ti-shield" style={{ marginRight: 6, color: '#4DFFB4' }} aria-hidden="true" />
              Adoption MFA
            </h2>
          </div>
          <div className="adm-mfa-section">
            <div className="adm-mfa-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#4DFFB4" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(mfaPct / 100) * 314} 314`}
                  transform="rotate(-90 60 60)" />
                <text x="60" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="300" fontFamily="JetBrains Mono,monospace">{mfaPct}%</text>
                <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Space Grotesk,sans-serif">activé</text>
              </svg>
            </div>
            <div className="adm-mfa-details">
              <div className="adm-mfa-row">
                <span className="adm-mfa-dot adm-mfa-dot--green" />
                <span className="adm-mfa-label">MFA activé</span>
                <span className="adm-mfa-val" style={{ color: '#4DFFB4' }}>{d.mfa_enabled_count}</span>
              </div>
              <div className="adm-mfa-row">
                <span className="adm-mfa-dot adm-mfa-dot--red" />
                <span className="adm-mfa-label">MFA désactivé</span>
                <span className="adm-mfa-val" style={{ color: '#FF4466' }}>{d.total_users - d.mfa_enabled_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Santé du système */}
      <div className="adm-panel">
        <div className="adm-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="adm-panel-title">
            <i className="ti ti-heartbeat" style={{ marginRight: 6, color: '#4DFFB4' }} aria-hidden="true" />
            Santé du système
          </h2>
          {health && (
            <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: 'var(--c-text3)', letterSpacing: '0.06em' }}>
              mis à jour il y a quelques secondes
            </span>
          )}
        </div>
        <div className="adm-health-grid">
          <HealthCard
            label="API Backend"
            icon="ti-bolt"
            status={health?.api?.status ?? 'loading'}
            value={health ? `${health.api.value} ms` : '…'}
          />
          <HealthCard
            label="Base de données"
            icon="ti-database"
            status={health?.db?.status ?? 'loading'}
            value={health ? `${health.db.value} ms` : '…'}
          />
          <HealthCard
            label="Auth / JWT"
            icon="ti-key"
            status={health?.auth?.status ?? 'loading'}
            value={health ? 'Actif' : '…'}
          />
          <HealthCard
            label="Enregistrements DB"
            icon="ti-server"
            status={health?.storage?.status ?? 'loading'}
            value={health ? health.storage.value.toLocaleString('fr-FR') : '…'}
          />
        </div>
      </div>

      {/* Activité récente */}
      <div className="adm-panel">
        <div className="adm-panel-header">
          <h2 className="adm-panel-title">
            <i className="ti ti-activity" style={{ marginRight: 6, color: '#A78BFA' }} aria-hidden="true" />
            Activité récente
          </h2>
        </div>
        <div className="adm-timeline">
          {d.recent_actions?.map((a, i) => {
            const cfg = ACTION_CFG[a.action] || { icon: 'ti-activity', color: '#888', label: a.action };
            return (
              <div key={i} className="adm-timeline-row">
                <div className="adm-timeline-icon" style={{ color: cfg.color, background: cfg.color + '15', borderColor: cfg.color + '30' }}>
                  <i className={`ti ${cfg.icon}`} aria-hidden="true" />
                </div>
                <div className="adm-timeline-info">
                  <span className="adm-timeline-action">{cfg.label}</span>
                  <span className="adm-timeline-user">{a.user_email}</span>
                </div>
                <span className="adm-timeline-date">{fmtDate(a.created_at)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
