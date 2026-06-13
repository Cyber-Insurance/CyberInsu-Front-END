import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminAPI } from '../../services/adminAPI';

const ROLE_COLORS = { admin: '#FF4466', assureur: '#00D4FF', courtier: '#4DFFB4', client: '#A78BFA' };

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout title="Vue globale" subtitle="Métriques de la plateforme">
      <div className="adm-loading"><div className="adm-spinner" /> CHARGEMENT...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Vue globale" subtitle="Métriques de la plateforme">

      {/* Stats cards */}
      <div className="adm-stats-grid">
        <div className="adm-stat" style={{ '--adm-stat-color': '#FF4466' }}>
          <div className="adm-stat-label">UTILISATEURS TOTAL</div>
          <div className="adm-stat-value">{stats?.total_users ?? 0}</div>
          <div className="adm-stat-sub">MFA actif : {stats?.mfa_enabled_count ?? 0}</div>
        </div>
        <div className="adm-stat" style={{ '--adm-stat-color': '#4DFFB4' }}>
          <div className="adm-stat-label">COURTIERS</div>
          <div className="adm-stat-value">{stats?.users_by_role?.courtier ?? 0}</div>
          <div className="adm-stat-sub">Rôle actif</div>
        </div>
        <div className="adm-stat" style={{ '--adm-stat-color': '#A78BFA' }}>
          <div className="adm-stat-label">CLIENTS</div>
          <div className="adm-stat-value">{stats?.users_by_role?.client ?? 0}</div>
          <div className="adm-stat-sub">Rôle actif</div>
        </div>
        <div className="adm-stat" style={{ '--adm-stat-color': '#FFB347' }}>
          <div className="adm-stat-label">AUDIT LOGS</div>
          <div className="adm-stat-value">{stats?.total_audit_logs ?? 0}</div>
          <div className="adm-stat-sub">Actions tracées</div>
        </div>
      </div>

      {/* Répartition par rôle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div className="adm-section">
          <div className="adm-section-head">
            <span className="adm-section-title">Répartition des rôles</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats && Object.entries(stats.users_by_role).map(([role, count]) => {
              const total = stats.total_users || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={role}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--c-text2)', textTransform: 'capitalize' }}>{role}</span>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: ROLE_COLORS[role] || 'var(--c-text3)' }}>{count} · {pct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: ROLE_COLORS[role] || 'var(--c-text3)', borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="adm-section">
          <div className="adm-section-head">
            <span className="adm-section-title">Dernières actions</span>
          </div>
          <div className="adm-timeline">
            {stats?.recent_actions?.length > 0 ? stats.recent_actions.map((log, i) => (
              <div key={i} className="adm-log-row">
                <div className={`adm-log-icon adm-log-icon--${getLogType(log.action)}`}>
                  {getLogEmoji(log.action)}
                </div>
                <div className="adm-log-body">
                  <div className="adm-log-action">{formatAction(log.action)}</div>
                  <div className="adm-log-meta">{log.user_email}</div>
                </div>
                <div className="adm-log-time">{formatDate(log.created_at)}</div>
              </div>
            )) : <div className="adm-empty">Aucune action récente</div>}
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="adm-section">
        <div className="adm-section-head">
          <span className="adm-section-title">Sécurité MFA</span>
        </div>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--c-text2)', marginBottom: 8 }}>
              {stats?.mfa_enabled_count ?? 0} utilisateur(s) sur {stats?.total_users ?? 0} ont activé le MFA
            </div>
            <div style={{ height: 6, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: stats?.total_users ? `${(stats.mfa_enabled_count / stats.total_users) * 100}%` : '0%',
                height: '100%', background: 'var(--c-accent)', borderRadius: 3, transition: 'width 1.2s ease'
              }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 28, color: 'var(--c-accent)' }}>
              {stats?.total_users ? Math.round((stats.mfa_enabled_count / stats.total_users) * 100) : 0}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--c-text3)', letterSpacing: '0.1em' }}>TAUX ADOPTION</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function getLogType(action) {
  if (action.includes('login') || action.includes('mfa')) return 'login';
  if (action.includes('create') || action.includes('register')) return 'create';
  if (action.includes('delete')) return 'delete';
  if (action.includes('update')) return 'update';
  return 'other';
}

function getLogEmoji(action) {
  if (action.includes('login')) return '→';
  if (action.includes('create') || action.includes('register')) return '+';
  if (action.includes('delete')) return '×';
  if (action.includes('update')) return '~';
  if (action.includes('mfa')) return '⬡';
  return '·';
}

function formatAction(action) {
  const map = { login: 'Connexion', register: 'Inscription', mfa_verified: 'MFA vérifié', mfa_setup: 'MFA configuré', create_user: 'Utilisateur créé', update_user: 'Utilisateur modifié', delete_user: 'Utilisateur supprimé', update_role_permissions: 'Permissions mises à jour' };
  return map[action] || action;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
