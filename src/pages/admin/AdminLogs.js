import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/adminAPI';

const MOCK_LOGS = Array.from({ length: 20 }, (_, i) => ({
  id_log: i + 1,
  user_email: ['admin@cyber.fr', 'courtier@cyber.fr', 'assureur@cyber.fr', 'client@cyber.fr'][i % 4],
  action: ['login', 'create_user', 'update_user', 'mfa_verified', 'register', 'mfa_setup', 'update_role_permissions', 'delete_user'][i % 8],
  table_cible: ['utilisateurs', 'roles', null, null][i % 4],
  id_cible: i % 3 === 0 ? i + 1 : null,
  ip_address: `192.168.1.${(i % 20) + 1}`,
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
}));

const ACTION_CONFIG = {
  login:               { icon: 'ti-login',       color: '#4DFFB4',  label: 'Connexion' },
  register:            { icon: 'ti-user-plus',   color: '#00D4FF',  label: 'Inscription' },
  create_user:         { icon: 'ti-user-plus',   color: '#A78BFA',  label: 'Créer utilisateur' },
  update_user:         { icon: 'ti-edit',        color: '#FFB347',  label: 'Modifier utilisateur' },
  delete_user:         { icon: 'ti-trash',       color: '#FF4466',  label: 'Supprimer utilisateur' },
  mfa_setup:           { icon: 'ti-shield',      color: '#FFB347',  label: 'Config MFA' },
  mfa_verified:        { icon: 'ti-shield-check',color: '#4DFFB4',  label: 'MFA vérifié' },
  update_role_permissions: { icon: 'ti-lock',    color: '#A78BFA',  label: 'Modif permissions' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AdminLogs() {
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage]         = useState(0);
  const limit = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = { skip: page * limit, limit, action: actionFilter || undefined };
    adminAPI.getAuditLogs(params)
      .then(r => {
        setLogs(r.data?.logs || r.data || []);
        setTotal(r.data?.total || 0);
      })
      .catch(() => {
        setLogs(MOCK_LOGS.slice(page * limit, (page + 1) * limit));
        setTotal(MOCK_LOGS.length);
      })
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? logs.filter(l => l.user_email?.includes(search) || l.action?.includes(search))
    : logs;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="adm-page fade-in">
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <i className="ti ti-search adm-search-icon" aria-hidden="true" />
          <input className="adm-search" placeholder="Filtrer par email ou action..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="adm-form-select adm-select-inline" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}>
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <button className="adm-btn-ghost" onClick={load}>
          <i className="ti ti-refresh" aria-hidden="true" />
          Actualiser
        </button>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header">
          <h2 className="adm-panel-title">
            Journal d'audit <span className="adm-count">{total}</span>
          </h2>
        </div>

        {loading ? <Loader /> : (
          <>
            <div className="adm-logs-list">
              {filtered.map((log, i) => {
                const cfg = ACTION_CONFIG[log.action] || { icon: 'ti-activity', color: '#888', label: log.action };
                return (
                  <div key={i} className="adm-log-row">
                    <div className="adm-log-icon" style={{ color: cfg.color, background: cfg.color + '12', borderColor: cfg.color + '25' }}>
                      <i className={`ti ${cfg.icon}`} aria-hidden="true" />
                    </div>
                    <div className="adm-log-main">
                      <div className="adm-log-top">
                        <span className="adm-log-action" style={{ color: cfg.color }}>{cfg.label}</span>
                        {log.table_cible && (
                          <span className="adm-log-target">→ {log.table_cible}{log.id_cible ? ` #${log.id_cible}` : ''}</span>
                        )}
                      </div>
                      <div className="adm-log-bottom">
                        <span className="adm-log-user">
                          <i className="ti ti-user" aria-hidden="true" />
                          {log.user_email || 'Système'}
                        </span>
                        {log.ip_address && (
                          <span className="adm-log-ip">
                            <i className="ti ti-network" aria-hidden="true" />
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="adm-log-date">{fmtDate(log.created_at)}</span>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="adm-empty">
                  <i className="ti ti-clipboard-off" aria-hidden="true" />
                  <span>Aucun log trouvé</span>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="adm-pagination">
                <button className="adm-page-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <i className="ti ti-chevron-left" aria-hidden="true" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} className={`adm-page-btn ${page === i ? 'adm-page-btn--active' : ''}`} onClick={() => setPage(i)}>
                    {i + 1}
                  </button>
                ))}
                <button className="adm-page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                  <i className="ti ti-chevron-right" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Loader() {
  return <div className="adm-loader"><div className="adm-spinner" /></div>;
}
