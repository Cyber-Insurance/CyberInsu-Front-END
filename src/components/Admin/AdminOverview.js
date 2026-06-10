import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/admin`;

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalFolders: 0,
    analyzedFolders: 0,
    aiAnalyses: 0,
    alerts: 0,
  });
  const [systemHealth, setSystemHealth] = useState({
    database: { status: 'healthy', uptime: '—' },
    api: { status: 'healthy', uptime: '—' },
    storage: { status: 'healthy', usage: '—' },
    security: { status: 'secure', alerts: 0 },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch users count
      const usersRes = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const totalUsers = usersRes.data.users?.length || 0;

      // Fetch audit logs for recent activities
      const auditRes = await axios.get(`${API_BASE}/audit_logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const logs = auditRes.data?.logs || [];

      setStats({
        totalUsers,
        activeUsers: totalUsers,
        totalFolders: 0,
        analyzedFolders: 0,
        aiAnalyses: 0,
        alerts: 0,
      });

      setRecentActivities(logs.slice(0, 5).map(log => ({
        id: log.id,
        user: log.user_email || 'Unknown',
        action: log.action || 'Action',
        timestamp: new Date(log.timestamp),
        type: 'activity',
      })));
    } catch (err) {
      console.error('Error fetching overview data:', err);
      // Use empty data if API fails
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalFolders: 0,
        analyzedFolders: 0,
        aiAnalyses: 0,
        alerts: 0,
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('fr-FR');
  };

  const getActivityIcon = (type) => {
    const icons = {
      login: '🔓',
      create: '✨',
      update: '✏️',
      download: '⬇️',
      delete: '🗑️',
      activity: '📝',
    };
    return icons[type] || '📝';
  };

  const getStatusColor = (status) => {
    return status === 'healthy' || status === 'secure' ? '#4DFFB4' : status === 'healthy' ? '#00D4FF' : '#FFB347';
  };

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
    <div className="admin-overview">
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">👥 Utilisateurs actifs</div>
          <span className="admin-stat-value">{stats.activeUsers}</span>
          <div className="admin-stat-trend">{stats.activeUsers > 0 ? `+${Math.floor(stats.activeUsers * 0.05)}` : 'Aucun'} cette semaine</div>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: stats.totalUsers > 0 ? `${(stats.activeUsers / stats.totalUsers) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-label">📂 Dossiers analysés</div>
          <span className="admin-stat-value">{stats.analyzedFolders}</span>
          <div className="admin-stat-trend">{stats.analyzedFolders > 0 ? `+${Math.floor(stats.analyzedFolders * 0.1)}` : '0'} cette semaine</div>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: stats.totalFolders > 0 ? `${(stats.analyzedFolders / stats.totalFolders) * 100}%` : '0%' }} />
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-label">🤖 Analyses IA</div>
          <span className="admin-stat-value">{stats.aiAnalyses}</span>
          <div className="admin-stat-trend">{stats.aiAnalyses > 0 ? `+${Math.floor(stats.aiAnalyses * 0.2)}` : '0'} cette semaine</div>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-label">⚠️ Alertes actives</div>
          <span className="admin-stat-value" style={{ color: '#FFB347' }}>{stats.alerts}</span>
          <div className="admin-stat-trend" style={{ color: '#FFB347' }}>{stats.alerts > 0 ? 'À traiter' : 'Aucune'}</div>
          <div className="admin-stat-bar">
            <div className="admin-stat-bar-fill" style={{ width: `${(stats.alerts / 20) * 100}%`, background: '#FFB347' }} />
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">💚 État du système</h2>
        </div>
        <div className="admin-health-grid">
          {Object.entries(systemHealth).map(([key, value]) => (
            <div key={key} className="admin-health-item">
              <div className="admin-health-header">
                <span className="admin-health-name">
                  {key === 'database' ? '🗄️ Base de données' :
                   key === 'api' ? '⚙️ API' :
                   key === 'storage' ? '💾 Stockage' :
                   '🔐 Sécurité'}
                </span>
                <span className="admin-health-status" style={{ color: getStatusColor(value.status) }}>
                  ● {value.status === 'healthy' || value.status === 'secure' ? 'Opérationnel' : 'Dégradé'}
                </span>
              </div>
              <div className="admin-health-detail">
                {key === 'storage' ? (
                  <>
                    <span className="admin-health-value">{value.usage}</span>
                    <div className="admin-health-bar">
                      <div className="admin-health-bar-fill" style={{ width: value.usage }} />
                    </div>
                  </>
                ) : key === 'security' ? (
                  <span className="admin-health-value">{value.alerts} alertes</span>
                ) : (
                  <span className="admin-health-value">Uptime: {value.uptime}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {recentActivities.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">📊 Activités récentes</h2>
            <a href="#" style={{ color: 'var(--c-accent)', fontSize: '12px', textDecoration: 'none' }}>
              Voir tous les logs →
            </a>
          </div>
          <div className="admin-activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="admin-activity-item">
                <span className="admin-activity-icon">{getActivityIcon(activity.type)}</span>
                <div className="admin-activity-details">
                  <div className="admin-activity-user">{activity.user}</div>
                  <div className="admin-activity-action">{activity.action}</div>
                </div>
                <div className="admin-activity-time">{formatDate(activity.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
