import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import './Register.css';

const ROLES = [
  { id: 3, label: 'Courtier', desc: 'Gère les dossiers clients', icon: '◈' },
  { id: 4, label: 'Client', desc: 'Entreprise assurée', icon: '◉' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [roleId, setRoleId] = useState(3);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState('');

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) ? 4 : 3;

  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort', 'Excellent'];
  const strengthColors = ['', '#FF4466', '#FFB347', '#4DFFB4', '#00D4FF'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (min. 6 caractères)'); return; }
    setLoading(true);
    try {
      await register(email, password, roleId);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root reg-root">
      <div className="reg-bg" />
      <div className="login-right" style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
        <div className="login-card" style={{ maxWidth: '440px', width: '100%' }}>
          <div className="login-card-scan" />
          <div className="login-card-corner tl" /><div className="login-card-corner tr" />
          <div className="login-card-corner bl" /><div className="login-card-corner br" />

          <div className="login-form-wrap">
            <div className="login-card-header">
              <div className="login-card-dots"><span /><span /><span /></div>
              <span className="login-card-id">REGISTER_MODULE_v1.0</span>
            </div>

            <h1 className="login-title">Créer un compte</h1>
            <p className="login-subtitle">Rejoignez CyberInsure · Accès sécurisé</p>

            <div className="reg-roles">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`reg-role ${roleId === r.id ? 'reg-role--active' : ''}`}
                  onClick={() => setRoleId(r.id)}
                >
                  <span className="reg-role-icon">{r.icon}</span>
                  <span className="reg-role-label">{r.label}</span>
                  <span className="reg-role-desc">{r.desc}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className={`lf-group ${focused === 'email' ? 'lf-group--active' : ''}`}>
                <label className="lf-label">EMAIL</label>
                <div className="lf-input-wrap">
                  <svg className="lf-icon" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8l8 5 8-5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} placeholder="vous@entreprise.com" required />
                </div>
              </div>

              <div className={`lf-group ${focused === 'pass' ? 'lf-group--active' : ''}`}>
                <label className="lf-label">MOT DE PASSE</label>
                <div className="lf-input-wrap">
                  <svg className="lf-icon" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="14" r="1.5" fill="currentColor"/></svg>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocused('pass')} onBlur={() => setFocused('')} placeholder="••••••••••••" required />
                  <button type="button" className="lf-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                    <svg viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </button>
                </div>
                {password && (
                  <div className="reg-strength">
                    <div className="reg-strength-bar">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="reg-strength-seg" style={{ background: i <= strength ? strengthColors[strength] : 'var(--c-border)' }} />
                      ))}
                    </div>
                    <span style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                  </div>
                )}
              </div>

              <div className={`lf-group ${focused === 'confirm' ? 'lf-group--active' : ''}`}>
                <label className="lf-label">CONFIRMER</label>
                <div className="lf-input-wrap">
                  <svg className="lf-icon" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')} placeholder="••••••••••••" required />
                </div>
                {confirm && password && (
                  <span style={{ fontSize: '11px', color: confirm === password ? 'var(--c-accent)' : 'var(--c-red)', fontFamily: 'var(--f-mono)', marginTop: '2px' }}>
                    {confirm === password ? '✓ Correspond' : '✗ Ne correspond pas'}
                  </span>
                )}
              </div>

              {error && (
                <div className="lf-error">
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.8" fill="currentColor"/></svg>
                  {error}
                </div>
              )}

              <button type="submit" className={`lf-btn ${loading ? 'lf-btn--loading' : ''}`} disabled={loading}>
                {loading ? <><span className="lf-spinner" /> CRÉATION DU COMPTE...</> : 'CRÉER MON COMPTE'}
              </button>
            </form>

            <div className="lf-footer">
              <span className="lf-footer-text">Déjà un compte ?</span>
              <Link to="/login" className="lf-footer-link">Se connecter →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
