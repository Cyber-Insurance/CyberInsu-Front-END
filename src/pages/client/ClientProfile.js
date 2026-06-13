import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import MFASetupModal from '../../components/MFASetupModal';

const STATUS_LABELS = {
  draft: 'Brouillon', soumis: 'Soumis', en_analyse: 'En analyse',
  devis_genere: 'Devis généré', valide: 'Validé', rejete: 'Rejeté',
};

export default function ClientProfile({ dossier }) {
  const { user, refreshUser } = useAuth();
  const [mfaModal, setMfaModal] = useState(null); // 'setup' | 'disable' | null

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  return (
    <div className="cl-page">

      {/* ── Informations personnelles ── */}
      <div className="cl-panel">
        <div className="cl-panel-header">
          <i className="ti ti-user-circle" style={{ fontSize: 16, color: '#A78BFA' }} />
          <span className="cl-panel-title">Informations personnelles</span>
        </div>
        <div className="cl-profile-rows">
          <ProfileRow icon="ti-mail"       label="Adresse e-mail"  value={user?.email} />
          <ProfileRow icon="ti-id-badge"   label="Rôle"            value={user?.role} accent />
          <ProfileRow icon="ti-calendar"   label="Membre depuis"   value={fmtDate(user?.created_at)} mono />
        </div>
      </div>

      {/* ── Entreprise ── */}
      {dossier && (
        <div className="cl-panel">
          <div className="cl-panel-header">
            <i className="ti ti-building" style={{ fontSize: 16, color: '#A78BFA' }} />
            <span className="cl-panel-title">Mon entreprise</span>
          </div>
          <div className="cl-profile-rows">
            <ProfileRow icon="ti-building"        label="Raison sociale"  value={dossier.company} />
            <ProfileRow icon="ti-category"        label="Secteur"         value={dossier.secteur || '—'} />
            <ProfileRow icon="ti-users"           label="Taille"          value={dossier.taille  || '—'} />
            <ProfileRow icon="ti-folder-open"     label="Statut dossier"  value={STATUS_LABELS[dossier.status] || dossier.status} accent />
            {dossier.score != null && (
              <ProfileRow icon="ti-shield-half"   label="Score cyber"     value={`${dossier.score} / 100 — ${dossier.niveau_risque}`} />
            )}
          </div>
        </div>
      )}

      {/* ── Sécurité ── */}
      <div className="cl-panel">
        <div className="cl-panel-header">
          <i className="ti ti-lock" style={{ fontSize: 16, color: '#A78BFA' }} />
          <span className="cl-panel-title">Sécurité du compte</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* MFA row */}
          <div className="cl-security-row">
            <div className="cl-security-left">
              <div className="cl-security-icon">
                <i className="ti ti-device-mobile" />
              </div>
              <div>
                <div className="cl-security-title">Authentification à deux facteurs</div>
                <div className="cl-security-sub">
                  {user?.mfa_enabled
                    ? 'Google Authenticator est configuré sur votre compte.'
                    : 'Ajoutez une couche de sécurité supplémentaire avec Google Authenticator.'}
                </div>
              </div>
            </div>
            <div className="cl-security-right">
              <div className={`cl-mfa-badge ${user?.mfa_enabled ? 'cl-mfa-badge--on' : 'cl-mfa-badge--off'}`}>
                <span className="cl-mfa-dot" />
                {user?.mfa_enabled ? 'Activé' : 'Désactivé'}
              </div>
              <button
                className={user?.mfa_enabled ? 'cl-btn-danger' : 'cl-btn-primary'}
                onClick={() => setMfaModal(user?.mfa_enabled ? 'disable' : 'setup')}
              >
                {user?.mfa_enabled
                  ? <><i className="ti ti-lock-open" /> Désactiver</>
                  : <><i className="ti ti-shield-check" /> Activer le MFA</>
                }
              </button>
            </div>
          </div>

          {/* Hint si désactivé */}
          {!user?.mfa_enabled && (
            <div className="cl-security-hint">
              <i className="ti ti-info-circle" />
              Vous aurez besoin de l'application <strong>Google Authenticator</strong> sur votre téléphone.
            </div>
          )}
        </div>
      </div>

      {/* Modal MFA */}
      {mfaModal && (
        <MFASetupModal
          mode={mfaModal}
          onClose={() => setMfaModal(null)}
          onSuccess={() => { refreshUser(); setMfaModal(null); }}
        />
      )}
    </div>
  );
}

function ProfileRow({ icon, label, value, mono, accent }) {
  return (
    <div className="cl-profile-row">
      <div className="cl-profile-row-label">
        <i className={`ti ${icon}`} />
        {label}
      </div>
      <div
        className="cl-profile-row-value"
        style={{
          fontFamily: mono ? 'var(--f-mono)' : undefined,
          color: accent ? '#A78BFA' : undefined,
          fontSize: mono ? 13 : undefined,
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}
