import React, { useState, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';
import './MFASetupModal.css';

export default function MFASetupModal({ mode, onClose, onSuccess }) {
  const [step, setStep] = useState(mode === 'setup' ? 'loading' : 'disable');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const digitRefs = useRef([]);

  useEffect(() => {
    if (mode !== 'setup') return;
    authAPI.setupMfa()
      .then(res => {
        setQrCode(res.data.qr_code);
        setSecret(res.data.secret);
        setStep('scan');
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Erreur lors de la génération du QR code');
        setStep('error');
      });
  }, [mode]);

  const handleDigitInput = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) digitRefs.current[i + 1]?.focus();
    if (next.every(d => d)) handleConfirm(next.join(''));
  };

  const handleDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      digitRefs.current[i - 1]?.focus();
    }
  };

  const handleConfirm = async (code) => {
    setError('');
    setLoading(true);
    try {
      await authAPI.confirmMfa({ code: code || digits.join('') });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Code invalide');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setError('');
    setLoading(true);
    try {
      await authAPI.disableMfa({ password });
      setStep('disableSuccess');
    } catch (err) {
      setError(err.response?.data?.detail || 'Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mfa-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mfa-modal">
        <button className="mfa-modal-close" onClick={onClose} aria-label="Fermer">
          <svg viewBox="0 0 20 20" fill="none">
            <line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {step === 'loading' && (
          <div className="mfa-center-state">
            <div className="mfa-spinner" />
            <p>Génération du QR code...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="mfa-center-state">
            <div className="mfa-err-msg">{error}</div>
            <button className="mfa-btn mfa-btn--ghost" onClick={onClose}>Fermer</button>
          </div>
        )}

        {step === 'scan' && (
          <>
            <div className="mfa-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <polygon points="20,3 37,12 37,28 20,37 3,28 3,12" stroke="#4DFFB4" strokeWidth="1.5" fill="rgba(77,255,180,0.06)"/>
                <rect x="11" y="11" width="7" height="7" rx="1" stroke="#4DFFB4" strokeWidth="1.5"/>
                <rect x="22" y="11" width="7" height="7" rx="1" stroke="#4DFFB4" strokeWidth="1.5"/>
                <rect x="11" y="22" width="7" height="7" rx="1" stroke="#4DFFB4" strokeWidth="1.5"/>
                <path d="M22 22h3v3M27 22v5M22 27h5" stroke="#4DFFB4" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="mfa-title">Configurer Google Authenticator</h2>
            <p className="mfa-sub">Scannez ce QR code avec l'application Google Authenticator</p>

            <div className="mfa-qr-wrap">
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code MFA" className="mfa-qr-img" />
              <div className="mfa-qr-corners">
                <span className="mfa-qr-c tl"/><span className="mfa-qr-c tr"/>
                <span className="mfa-qr-c bl"/><span className="mfa-qr-c br"/>
              </div>
            </div>

            <div className="mfa-secret-row">
              <span className="mfa-secret-label">CLÉ MANUELLE</span>
              <code className="mfa-secret-code">{secret}</code>
              <button className="mfa-copy-btn" onClick={copySecret} title={copied ? 'Copié !' : 'Copier'}>
                {copied
                  ? <svg viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke="#4DFFB4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                }
              </button>
            </div>

            <button className="mfa-btn mfa-btn--primary" onClick={() => { setError(''); setStep('verify'); }}>
              J'ai scanné, continuer
              <svg viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="mfa-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <polygon points="20,3 37,12 37,28 20,37 3,28 3,12" stroke="#4DFFB4" strokeWidth="1.5" fill="rgba(77,255,180,0.06)"/>
                <path d="M13 20h14M20 13v14" stroke="#4DFFB4" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="mfa-title">Confirmer le code</h2>
            <p className="mfa-sub">Entrez le code à 6 chiffres affiché dans Google Authenticator</p>

            <div className="mfa-digits">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => digitRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitInput(i, e.target.value)}
                  onKeyDown={e => handleDigitKey(i, e)}
                  className={`mfa-digit ${d ? 'mfa-digit--filled' : ''}`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <div className="mfa-err-msg">{error}</div>}

            <div className="mfa-actions">
              <button className="mfa-btn mfa-btn--ghost" onClick={() => { setError(''); setStep('scan'); }}>
                <svg viewBox="0 0 20 20" fill="none"><path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Retour
              </button>
              <button
                className={`mfa-btn mfa-btn--primary ${loading ? 'mfa-btn--loading' : ''}`}
                onClick={() => handleConfirm()}
                disabled={loading || !digits.every(d => d)}
              >
                {loading ? <><span className="mfa-spin-sm" /> Vérification…</> : 'Confirmer'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="mfa-result-icon mfa-result-icon--ok">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" stroke="#4DFFB4" strokeWidth="1.5" fill="rgba(77,255,180,0.06)"/>
                <polyline points="18,28 24,34 38,20" stroke="#4DFFB4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="mfa-title" style={{ color: 'var(--c-accent)' }}>MFA Activé</h2>
            <p className="mfa-sub">Google Authenticator est maintenant configuré. À chaque connexion, un code vous sera demandé.</p>
            <button className="mfa-btn mfa-btn--primary" onClick={() => { onSuccess(); onClose(); }}>Terminé</button>
          </>
        )}

        {step === 'disable' && (
          <>
            <div className="mfa-icon-wrap mfa-icon-wrap--warn">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <polygon points="20,4 36,30 4,30" stroke="#FFB347" strokeWidth="1.5" fill="rgba(255,179,71,0.06)"/>
                <line x1="20" y1="14" x2="20" y2="22" stroke="#FFB347" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="20" cy="26" r="1.5" fill="#FFB347"/>
              </svg>
            </div>
            <h2 className="mfa-title">Désactiver le MFA</h2>
            <p className="mfa-sub">Confirmez votre mot de passe pour supprimer l'authentification à deux facteurs.</p>

            <div className="mfa-field">
              <label className="mfa-field-label">MOT DE PASSE</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && password && handleDisable()}
                placeholder="••••••••••••"
                className="mfa-field-input"
                autoFocus
              />
            </div>

            {error && <div className="mfa-err-msg">{error}</div>}

            <div className="mfa-actions">
              <button className="mfa-btn mfa-btn--ghost" onClick={onClose}>Annuler</button>
              <button
                className={`mfa-btn mfa-btn--danger ${loading ? 'mfa-btn--loading' : ''}`}
                onClick={handleDisable}
                disabled={loading || !password}
              >
                {loading ? <><span className="mfa-spin-sm" /> Désactivation…</> : 'Désactiver'}
              </button>
            </div>
          </>
        )}

        {step === 'disableSuccess' && (
          <>
            <div className="mfa-result-icon mfa-result-icon--off">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <polygon points="28,4 50,16 50,40 28,52 6,40 6,16" stroke="#FF4466" strokeWidth="1.5" fill="rgba(255,68,102,0.06)"/>
                <line x1="20" y1="20" x2="36" y2="36" stroke="#FF4466" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="36" y1="20" x2="20" y2="36" stroke="#FF4466" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="mfa-title">MFA Désactivé</h2>
            <p className="mfa-sub">L'authentification à deux facteurs a été retirée de votre compte.</p>
            <button className="mfa-btn mfa-btn--primary" onClick={() => { onSuccess(); onClose(); }}>Terminé</button>
          </>
        )}
      </div>
    </div>
  );
}
