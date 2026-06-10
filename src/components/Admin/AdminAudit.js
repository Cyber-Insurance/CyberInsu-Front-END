import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/admin';

export default function AdminAudit({ filters }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [filters?.action]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (filters?.action) params.append('action', filters.action);

      console.log('Fetching audit logs from:', `${API_BASE}/audit_logs?${params.toString()}`);
      
      const response = await axios.get(`${API_BASE}/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Audit logs response:', response.data);

      // Transform API response - handle both array and object with logs property
      let logsArray = Array.isArray(response.data) ? response.data : response.data.logs || response.data.audit_logs || [];

      console.log('Transformed logs array:', logsArray);

      const transformedLogs = logsArray.map(log => {
        // Ensure timestamp is a Date object
        let timestampDate = new Date();
        if (log.timestamp) {
          timestampDate = typeof log.timestamp === 'string' ? new Date(log.timestamp) : log.timestamp;
        } else if (log.created_at) {
          timestampDate = typeof log.created_at === 'string' ? new Date(log.created_at) : log.created_at;
        }
        
        return {
          id: log.id_log || log.id,
          timestamp: timestampDate,
          user: log.user_email || log.email || 'Unknown',
          action: (log.action || 'update').toLowerCase(),
          description: log.description || log.table_cible || 'Aucune description',
          status: 'success', // API doesn't return status, assume success
          ipAddress: log.ip_address || log.ip || 'N/A',
          userAgent: log.user_agent || 'N/A',
        };
      });

      console.log('Final transformed logs:', transformedLogs);

      setLogs(transformedLogs);
    } catch (err) {
      setError('Erreur lors du chargement des logs');
      console.error('Error fetching audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      login: '🔓',
      create: '✨',
      update: '✏️',
      delete: '🗑️',
    };
    return icons[action] || '📝';
  };

  const getActionLabel = (action) => {
    const labels = {
      login: 'Connexion',
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
    };
    return labels[action] || action;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return formatDate(date);
  };

  const filteredLogs = logs.filter(log => {
    const matchAction = !filters.action || log.action === filters.action;
    return matchAction;
  });

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-audit">
      {error && (
        <div className="admin-alert admin-alert--error">
          <span>✗</span>
          <span>{error}</span>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Audit Logs</h2>
          <button className="admin-btn" style={{ background: 'rgba(77,255,180,0.1)', color: '#4DFFB4', borderColor: 'rgba(77,255,180,0.2)' }}>
            📥 Exporter en CSV
          </button>
        </div>

        {filteredLogs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>IP Address</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <td style={{ fontFamily: 'var(--f-mono)', fontSize: '11px' }}>
                        {formatTime(log.timestamp)}
                      </td>
                      <td style={{ fontFamily: 'var(--f-mono)', fontSize: '11px' }}>
                        {log.user}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{getActionIcon(log.action)}</span>
                          <span>{getActionLabel(log.action)}</span>
                        </span>
                      </td>
                      <td>{log.description}</td>
                      <td>
                        <span className={`admin-badge ${log.status === 'success' ? 'admin-badge--active' : 'admin-badge--unverified'}`}>
                          {log.status === 'success' ? '✓ Succès' : '✗ Échoué'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--f-mono)', fontSize: '11px' }}>
                        {log.ipAddress}
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn--small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedLog(expandedLog === log.id ? null : log.id);
                          }}
                        >
                          {expandedLog === log.id ? '▼' : '▶'}
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr style={{ background: 'rgba(77,255,180,0.05)' }}>
                        <td colSpan="7">
                          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <p style={{ fontSize: '11px', color: 'var(--c-text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                Informations détaillées
                              </p>
                              <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--c-text)' }}>
                                <div><strong>ID Log:</strong> {log.id}</div>
                                <div><strong>Timestamp:</strong> {formatDate(log.timestamp)}</div>
                                <div><strong>Utilisateur:</strong> {log.user}</div>
                                <div><strong>Action:</strong> {getActionLabel(log.action)}</div>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontSize: '11px', color: 'var(--c-text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                Détails de la requête
                              </p>
                              <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--c-text)', fontFamily: 'var(--f-mono)' }}>
                                <div><strong>IP:</strong> {log.ipAddress}</div>
                                <div><strong>Statut:</strong> {log.status === 'success' ? 'Succès (200)' : 'Erreur (401)'}</div>
                                <div><strong>User Agent:</strong> Mozilla/5.0...</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-icon">📊</div>
            <div className="admin-empty-title">Aucun log trouvé</div>
            <div className="admin-empty-description">
              Aucune activité ne correspond à vos critères de filtrage.
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">✓ Actions réussies</div>
          <span className="admin-stat-value">{filteredLogs.filter(l => l.status === 'success').length}</span>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: `${(filteredLogs.filter(l => l.status === 'success').length / filteredLogs.length) * 100}%` }} />
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-label">✗ Actions échouées</div>
          <span className="admin-stat-value">{filteredLogs.filter(l => l.status === 'failed').length}</span>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: `${(filteredLogs.filter(l => l.status === 'failed').length / filteredLogs.length) * 100}%`, background: '#FF4466' }} />
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-label">🔐 Tentatives de connexion</div>
          <span className="admin-stat-value">{filteredLogs.filter(l => l.action === 'login').length}</span>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: '45%', background: '#00D4FF' }} />
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-label">📈 Actions aujourd'hui</div>
          <span className="admin-stat-value">{filteredLogs.length}</span>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: '80%', background: '#FFB347' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
