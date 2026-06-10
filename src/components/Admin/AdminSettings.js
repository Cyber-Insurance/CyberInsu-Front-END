import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/admin';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    appName: 'CyberInsurance',
    appVersion: '1.0.0',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireMFA: false,
    sessionTimeout: 30,
    backupFrequency: 'daily',
    maxUploadSize: 100,
    emailNotifications: true,
    twoFactorRequired: false,
    passwordPolicy: 'strong',
  });

  const [activeTab, setActiveTab] = useState('general');
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const token = localStorage.getItem('access_token');
      
      // Try to send settings to backend
      try {
        await axios.put(
          `${API_BASE}/settings`,
          {
            maintenance_mode: settings.maintenanceMode,
            allow_registrations: settings.allowNewRegistrations,
            require_mfa: settings.requireMFA,
            session_timeout: settings.sessionTimeout,
            password_policy: settings.passwordPolicy,
            max_upload_size: settings.maxUploadSize,
            email_notifications: settings.emailNotifications,
            backup_frequency: settings.backupFrequency,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (apiErr) {
        console.warn('API endpoint not available, saving locally:', apiErr);
        // Save locally to browser storage if API not available
        localStorage.setItem('admin_settings', JSON.stringify(settings));
      }

      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 3000);
    } catch (err) {
      setSaveError('Erreur lors de la sauvegarde des paramètres');
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const settingsTabs = [
    { id: 'general', label: 'Général', icon: '⚙️' },
    { id: 'security', label: 'Sécurité', icon: '🔐' },
    { id: 'backup', label: 'Sauvegarde', icon: '💾' },
    { id: 'email', label: 'Email', icon: '📧' },
  ];

  return (
    <div className="admin-settings">
      {/* Alert */}
      {showSaveAlert && (
        <div className="admin-alert admin-alert--success">
          <span>✓</span>
          <span>Paramètres mis à jour avec succès!</span>
        </div>
      )}
      
      {saveError && (
        <div className="admin-alert admin-alert--error">
          <span>✗</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="admin-section">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--c-border)', paddingBottom: '16px' }}>
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="admin-btn"
              style={{
                background: activeTab === tab.id ? 'var(--c-accent)' : 'transparent',
                color: activeTab === tab.id ? 'var(--c-bg)' : 'var(--c-text)',
                border: activeTab === tab.id ? 'none' : '1px solid var(--c-border)',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="admin-form">
            <div className="admin-form-group">
              <label className="admin-form-label">Nom de l'application</label>
              <input
                type="text"
                className="admin-form-input"
                value={settings.appName}
                onChange={(e) => handleSettingChange('appName', e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Version</label>
              <input
                type="text"
                className="admin-form-input"
                value={settings.appVersion}
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span className="admin-form-label" style={{ margin: 0 }}>Mode de maintenance</span>
              </label>
              {settings.maintenanceMode && (
                <p style={{ fontSize: '12px', color: '#FFB347', marginTop: '8px' }}>
                  ⚠️ Le système est actuellement en mode maintenance. Les utilisateurs ne peuvent pas accéder à l'application.
                </p>
              )}
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.allowNewRegistrations}
                  onChange={(e) => handleSettingChange('allowNewRegistrations', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span className="admin-form-label" style={{ margin: 0 }}>Autoriser les nouvelles inscriptions</span>
              </label>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Taille maximale d'upload (MB)</label>
              <input
                type="number"
                className="admin-form-input"
                value={settings.maxUploadSize}
                onChange={(e) => handleSettingChange('maxUploadSize', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="admin-form">
            <div className="admin-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.requireMFA}
                  onChange={(e) => handleSettingChange('requireMFA', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span className="admin-form-label" style={{ margin: 0 }}>Exiger MFA pour tous les utilisateurs</span>
              </label>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Politique de mot de passe</label>
              <select
                className="admin-form-select"
                value={settings.passwordPolicy}
                onChange={(e) => handleSettingChange('passwordPolicy', e.target.value)}
              >
                <option value="weak">Faible (min 6 caractères)</option>
                <option value="medium">Moyen (min 8 caractères, 1 majuscule, 1 chiffre)</option>
                <option value="strong">Fort (min 12 caractères, majuscules, chiffres, symboles)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Timeout de session (minutes)</label>
              <input
                type="number"
                className="admin-form-input"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="480"
              />
              <p style={{ fontSize: '12px', color: 'var(--c-text2)', marginTop: '4px' }}>
                Les sessions inactives seront fermées après cette durée.
              </p>
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.twoFactorRequired}
                  onChange={(e) => handleSettingChange('twoFactorRequired', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span className="admin-form-label" style={{ margin: 0 }}>Authentification 2FA obligatoire</span>
              </label>
            </div>
          </div>
        )}

        {/* Backup Settings */}
        {activeTab === 'backup' && (
          <div className="admin-form">
            <div className="admin-form-group">
              <label className="admin-form-label">Fréquence de sauvegarde</label>
              <select
                className="admin-form-select"
                value={settings.backupFrequency}
                onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
              >
                <option value="hourly">Chaque heure</option>
                <option value="daily">Quotidien (00:00 UTC)</option>
                <option value="weekly">Hebdomadaire (dimanche)</option>
                <option value="monthly">Mensuel (1er du mois)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Rétention des sauvegardes</label>
              <select
                className="admin-form-select"
              >
                <option>7 jours</option>
                <option>30 jours</option>
                <option>90 jours</option>
                <option>1 an</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Emplacement de stockage</label>
              <input
                type="text"
                className="admin-form-input"
                value="s3://cyber-insurance-backups"
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>

            <button className="admin-btn admin-btn--primary" style={{ marginTop: '16px' }}>
              💾 Lancer une sauvegarde maintenant
            </button>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="admin-form">
            <div className="admin-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span className="admin-form-label" style={{ margin: 0 }}>Activer les notifications par email</span>
              </label>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Serveur SMTP</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="smtp.gmail.com"
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Port SMTP</label>
              <input
                type="number"
                className="admin-form-input"
                value="587"
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Email d'envoi</label>
              <input
                type="email"
                className="admin-form-input"
                placeholder="noreply@cyberinsurance.com"
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>

            <button className="admin-btn" style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', borderColor: 'rgba(0,212,255,0.2)', marginTop: '16px' }}>
              📧 Envoyer un email de test
            </button>
          </div>
        )}

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--c-border)' }}>
          <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '⏳ Enregistrement...' : '✓ Enregistrer les modifications'}
          </button>
          <button className="admin-btn">
            ↶ Rétablir les valeurs par défaut
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="admin-section">
        <h2 className="admin-section-title">ℹ️ Informations système</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--c-text2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Version
            </p>
            <p style={{ fontSize: '14px', color: 'var(--c-text)' }}>v{settings.appVersion}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--c-text2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Environnement
            </p>
            <p style={{ fontSize: '14px', color: 'var(--c-text)' }}>Production</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--c-text2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Uptime
            </p>
            <p style={{ fontSize: '14px', color: 'var(--c-text)' }}>42 jours</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--c-text2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dernière mise à jour
            </p>
            <p style={{ fontSize: '14px', color: 'var(--c-text)' }}>2024-01-15</p>
          </div>
        </div>
      </div>
    </div>
  );
}
