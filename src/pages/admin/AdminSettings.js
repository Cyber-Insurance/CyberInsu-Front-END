import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/adminAPI';

const TABS = [
  { id: 'general',  icon: 'ti-settings',    label: 'Général' },
  { id: 'security', icon: 'ti-shield-lock', label: 'Sécurité' },
  { id: 'backup',   icon: 'ti-database',    label: 'Sauvegarde' },
  { id: 'email',    icon: 'ti-mail',        label: 'Email' },
];

const DEFAULTS = {
  appName:              'CyberInsurance',
  maintenanceMode:      false,
  allowNewRegistrations: true,
  requireMFA:           false,
  twoFactorRequired:    false,
  sessionTimeout:       30,
  passwordPolicy:       'strong',
  maxUploadSize:        100,
  backupFrequency:      'daily',
  backupRetention:      '30',
  emailNotifications:   true,
};

const fromApi = (d) => ({
  appName:               d.app_name,
  maintenanceMode:       d.maintenance_mode,
  allowNewRegistrations: d.allow_registrations,
  requireMFA:            d.require_mfa,
  twoFactorRequired:     d.two_factor_required,
  sessionTimeout:        d.session_timeout,
  passwordPolicy:        d.password_policy,
  maxUploadSize:         d.max_upload_size,
  backupFrequency:       d.backup_frequency,
  backupRetention:       String(d.backup_retention),
  emailNotifications:    d.email_notifications,
});

const toApi = (s) => ({
  app_name:            s.appName,
  maintenance_mode:    s.maintenanceMode,
  allow_registrations: s.allowNewRegistrations,
  require_mfa:         s.requireMFA,
  two_factor_required: s.twoFactorRequired,
  session_timeout:     Number(s.sessionTimeout),
  password_policy:     s.passwordPolicy,
  max_upload_size:     Number(s.maxUploadSize),
  backup_frequency:    s.backupFrequency,
  backup_retention:    Number(s.backupRetention),
  email_notifications: s.emailNotifications,
});

export default function AdminSettings() {
  const [settings,    setSettings]    = useState(DEFAULTS);
  const [savedSettings, setSaved]     = useState(DEFAULTS);
  const [activeTab,   setActiveTab]   = useState('general');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    adminAPI.getSettings()
      .then(res => {
        const data = fromApi(res.data);
        setSettings(data);
        setSaved(data);
      })
      .catch(() => {/* garde les defaults si l'API est indisponible */})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(toApi(settings));
      setSaved(settings);
      showToast('Paramètres enregistrés avec succès');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setSettings(savedSettings);

  if (loading) {
    return (
      <div className="adm-page fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: 'var(--c-text2)' }}>
          <div className="adm-spinner" />
          <span style={{ fontSize: 13 }}>Chargement des paramètres...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page fade-in">
      {toast && (
        <div className={`adm-toast adm-toast--${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-circle-check' : 'ti-circle-x'}`} aria-hidden="true" />
          {toast.msg}
        </div>
      )}

      <div className="adm-panel">
        <div className="adm-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="adm-panel-title">Configuration de la plateforme</h2>
          {isDirty && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(255,179,71,0.08)', border: '1px solid rgba(255,179,71,0.25)',
              color: '#FFB347', fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.06em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB347', display: 'inline-block' }} />
              MODIFICATIONS NON SAUVEGARDÉES
            </span>
          )}
        </div>

        <div className="adm-settings-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`adm-settings-tab ${activeTab === t.id ? 'adm-settings-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`ti ${t.icon}`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="adm-settings-body">

          {/* ── GÉNÉRAL ── */}
          {activeTab === 'general' && (
            <div className="adm-settings-grid">
              <SettingsField label="Nom de l'application">
                <input className="adm-form-input" type="text" value={settings.appName}
                  onChange={e => set('appName', e.target.value)} />
              </SettingsField>

              <SettingsField label="Version">
                <input className="adm-form-input" type="text" value="1.0.0" disabled style={{ opacity: 0.5 }} />
              </SettingsField>

              <SettingsField label="Taille max d'upload (MB)">
                <input className="adm-form-input" type="number" min="1" max="1000" value={settings.maxUploadSize}
                  onChange={e => set('maxUploadSize', e.target.value)} />
              </SettingsField>

              <SettingsToggle
                label="Mode maintenance"
                desc={settings.maintenanceMode ? 'Les utilisateurs ne peuvent pas accéder à l\'application.' : 'La plateforme est accessible normalement.'}
                warn={settings.maintenanceMode}
                checked={settings.maintenanceMode}
                onChange={v => set('maintenanceMode', v)}
              />

              <SettingsToggle
                label="Autoriser les nouvelles inscriptions"
                desc="Permet aux nouveaux utilisateurs de créer un compte depuis la page d'inscription."
                checked={settings.allowNewRegistrations}
                onChange={v => set('allowNewRegistrations', v)}
              />
            </div>
          )}

          {/* ── SÉCURITÉ ── */}
          {activeTab === 'security' && (
            <div className="adm-settings-grid">
              <SettingsField label="Politique de mot de passe">
                <select className="adm-form-select" value={settings.passwordPolicy}
                  onChange={e => set('passwordPolicy', e.target.value)}>
                  <option value="weak">Faible — min. 6 caractères</option>
                  <option value="medium">Moyen — min. 8 car., 1 maj., 1 chiffre</option>
                  <option value="strong">Fort — min. 12 car., maj., chiffres, symboles</option>
                </select>
              </SettingsField>

              <SettingsField label="Timeout de session (minutes)" hint="Les sessions inactives seront fermées après cette durée.">
                <input className="adm-form-input" type="number" value={settings.sessionTimeout}
                  min="5" max="480"
                  onChange={e => set('sessionTimeout', e.target.value)} />
              </SettingsField>

              <SettingsToggle
                label="Exiger MFA pour tous les utilisateurs"
                desc="Force l'activation du MFA (Google Authenticator) lors de la prochaine connexion."
                checked={settings.requireMFA}
                onChange={v => set('requireMFA', v)}
              />

              <SettingsToggle
                label="2FA obligatoire"
                desc="L'authentification à deux facteurs sera requise pour tous les accès."
                checked={settings.twoFactorRequired}
                onChange={v => set('twoFactorRequired', v)}
              />
            </div>
          )}

          {/* ── SAUVEGARDE ── */}
          {activeTab === 'backup' && (
            <div className="adm-settings-grid">
              <SettingsField label="Fréquence de sauvegarde">
                <select className="adm-form-select" value={settings.backupFrequency}
                  onChange={e => set('backupFrequency', e.target.value)}>
                  <option value="hourly">Chaque heure</option>
                  <option value="daily">Quotidien (00:00 UTC)</option>
                  <option value="weekly">Hebdomadaire (dimanche)</option>
                  <option value="monthly">Mensuel (1er du mois)</option>
                </select>
              </SettingsField>

              <SettingsField label="Rétention des sauvegardes">
                <select className="adm-form-select" value={settings.backupRetention}
                  onChange={e => set('backupRetention', e.target.value)}>
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                  <option value="365">1 an</option>
                </select>
              </SettingsField>

              <SettingsField label="Emplacement de stockage">
                <input className="adm-form-input" type="text" value="s3://cyber-insurance-backups" disabled style={{ opacity: 0.5 }} />
              </SettingsField>

              <div className="adm-settings-action">
                <button className="adm-btn-ghost" style={{ color: '#00D4FF', borderColor: 'rgba(0,212,255,0.3)' }}>
                  <i className="ti ti-database-export" aria-hidden="true" />
                  Lancer une sauvegarde maintenant
                </button>
              </div>
            </div>
          )}

          {/* ── EMAIL ── */}
          {activeTab === 'email' && (
            <div className="adm-settings-grid">
              <SettingsToggle
                label="Notifications par email"
                desc="Envoie des alertes et notifications aux utilisateurs par email."
                checked={settings.emailNotifications}
                onChange={v => set('emailNotifications', v)}
              />

              <SettingsField label="Serveur SMTP">
                <input className="adm-form-input" type="text" placeholder="smtp.gmail.com" disabled style={{ opacity: 0.5 }} />
              </SettingsField>

              <SettingsField label="Port SMTP">
                <input className="adm-form-input" type="number" defaultValue="587" disabled style={{ opacity: 0.5 }} />
              </SettingsField>

              <SettingsField label="Email d'envoi">
                <input className="adm-form-input" type="email" placeholder="noreply@cyberinsurance.com" disabled style={{ opacity: 0.5 }} />
              </SettingsField>

              <div className="adm-settings-action">
                <button className="adm-btn-ghost" style={{ color: '#A78BFA', borderColor: 'rgba(167,139,250,0.3)' }}>
                  <i className="ti ti-send" aria-hidden="true" />
                  Envoyer un email de test
                </button>
              </div>
            </div>
          )}

          <div className="adm-settings-footer">
            <button className="adm-btn-primary" onClick={handleSave} disabled={saving || !isDirty}>
              {saving
                ? <><span className="adm-spinner adm-spinner--sm" /> Enregistrement...</>
                : <><i className="ti ti-device-floppy" aria-hidden="true" /> Enregistrer les modifications</>}
            </button>
            <button className="adm-btn-ghost" onClick={handleReset} disabled={!isDirty}>
              <i className="ti ti-refresh" aria-hidden="true" />
              Rétablir
            </button>
          </div>
        </div>
      </div>

      {/* Infos système */}
      <div className="adm-panel">
        <div className="adm-panel-header">
          <h2 className="adm-panel-title">
            <i className="ti ti-info-circle" style={{ marginRight: 8, color: '#00D4FF' }} aria-hidden="true" />
            Informations système
          </h2>
        </div>
        <div className="adm-sysinfo-grid">
          {[
            { label: 'Version',         value: 'v1.0.0',         icon: 'ti-tag',      color: '#4DFFB4' },
            { label: 'Environnement',   value: 'Production',     icon: 'ti-server',   color: '#00D4FF' },
            { label: 'Uptime',          value: '42 jours',       icon: 'ti-clock',    color: '#A78BFA' },
            { label: 'Dernière MàJ',    value: '2026-05-01',     icon: 'ti-calendar', color: '#FFB347' },
            { label: 'Base de données', value: 'PostgreSQL 15',  icon: 'ti-database', color: '#4DFFB4' },
            { label: 'Backend',         value: 'FastAPI 0.111',  icon: 'ti-bolt',     color: '#FF4466' },
          ].map((item, i) => (
            <div key={i} className="adm-sysinfo-card">
              <i className={`ti ${item.icon}`} style={{ color: item.color, fontSize: 18 }} aria-hidden="true" />
              <div>
                <p className="adm-sysinfo-label">{item.label}</p>
                <p className="adm-sysinfo-value">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsField({ label, hint, children }) {
  return (
    <div className="adm-settings-field">
      <label className="adm-form-label">{label}</label>
      {children}
      {hint && <p className="adm-settings-hint">{hint}</p>}
    </div>
  );
}

function SettingsToggle({ label, desc, checked, onChange, warn }) {
  return (
    <div className={`adm-settings-toggle ${warn ? 'adm-settings-toggle--warn' : ''}`}>
      <div className="adm-settings-toggle-text">
        <span className="adm-settings-toggle-label">{label}</span>
        {desc && <span className="adm-settings-toggle-desc" style={warn ? { color: '#FFB347' } : {}}>{desc}</span>}
      </div>
      <button
        className={`adm-toggle-switch ${checked ? 'adm-toggle-switch--on' : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="adm-toggle-knob" />
      </button>
    </div>
  );
}
