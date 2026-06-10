import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ROLE_REDIRECTS = {
  admin: '/dashboard/admin',
  assureur: '/dashboard/assureur',
  courtier: '/dashboard/courtier',
  client: '/dashboard/client',
};

export default function Login() {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState('');
  const mfaRefs = useRef([]);
  const canvasRef = useRef(null);

  // Particle canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77,255,180,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(77,255,180,${0.08 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.mfa_required) {
        setStep('mfa');
      } else {
        navigate(ROLE_REDIRECTS[result.user?.role] || '/dashboard/courtier');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaInput = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...mfaCode];
    next[i] = val.slice(-1);
    setMfaCode(next);
    if (val && i < 5) mfaRefs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join('').length === 6) {
      handleMfaSubmit(next.join(''));
    }
  };

  const handleMfaKey = (i, e) => {
    if (e.key === 'Backspace' && !mfaCode[i] && i > 0) {
      mfaRefs.current[i - 1]?.focus();
    }
  };

  const handleMfaSubmit = async (code) => {
    setError('');
    setLoading(true);
    try {
      const user = await verifyMfa(email, code || mfaCode.join(''));
      navigate(ROLE_REDIRECTS[user?.role] || '/dashboard/courtier');
    } catch (err) {
      setError(err.response?.data?.detail || 'Code invalide');
      setMfaCode(['', '', '', '', '', '']);
      mfaRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <canvas ref={canvasRef} className="login-canvas" />

      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#4DFFB4" strokeWidth="1.5" fill="none"/>
              <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" stroke="#4DFFB4" strokeWidth="1" fill="rgba(77,255,180,0.05)"/>
              <circle cx="18" cy="18" r="4" fill="#4DFFB4"/>
            </svg>
            <div className="login-logo-text">
              <span className="login-logo-cyber">CYBER</span>
              <span className="login-logo-insure">INSURE</span>
            </div>
          </div>
          <p className="login-tagline">Plateforme de cyber-assurance<br />nouvelle génération</p>
        </div>

        <div className="login-metrics">
          {[
            { val: '98.7%', label: 'PRÉCISION IA' },
            { val: '<30min', label: 'COTATION' },
            { val: 'ISO 27001', label: 'CONFORMITÉ' },
          ].map(({ val, label }) => (
            <div key={label} className="login-metric">
              <span className="login-metric-val">{val}</span>
              <span className="login-metric-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="login-threat">
          <div className="login-threat-header">
            <span className="login-threat-label">THREAT LEVEL</span>
            <span className="login-threat-value">HIGH</span>
          </div>
          <div className="login-threat-bar">
            <div className="login-threat-fill" />
            <div className="login-threat-pulse" />
          </div>
          <div className="login-threat-scale">
            <span>LOW</span><span>MEDIUM</span><span>HIGH</span><span>CRITICAL</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className={`login-card ${step === 'mfa' ? 'login-card--mfa' : ''}`}>
          <div className="login-card-scan" />
          <div className="login-card-corner tl" /><div className="login-card-corner tr" />
          <div className="login-card-corner bl" /><div className="login-card-corner br" />

          {step === 'login' ? (
            <div className="login-form-wrap" key="login">
              <div className="login-card-header">
                <div className="login-card-dots">
                  <span /><span /><span />
                </div>
                <span className="login-card-id">AUTH_MODULE_v2.5</span>
              </div>

              <h1 className="login-title">Connexion</h1>
              <p className="login-subtitle">Accès sécurisé · Chiffrement TLS 1.3</p>

              <form onSubmit={handleLogin} className="login-form" noValidate>
                <div className={`lf-group ${focused === 'email' ? 'lf-group--active' : ''} ${email ? 'lf-group--filled' : ''}`}>
                  <label className="lf-label">IDENTIFIANT</label>
                  <div className="lf-input-wrap">
                    <svg className="lf-icon" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 8l8 5 8-5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      placeholder="vous@entreprise.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className={`lf-group ${focused === 'pass' ? 'lf-group--active' : ''} ${password ? 'lf-group--filled' : ''}`}>
                  <label className="lf-label">MOT DE PASSE</label>
                  <div className="lf-input-wrap">
                    <svg className="lf-icon" viewBox="0 0 20 20" fill="none">
                      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="10" cy="14" r="1.5" fill="currentColor"/>
                    </svg>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('pass')}
                      onBlur={() => setFocused('')}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" className="lf-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                      {showPass ? (
                        <svg viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5"/></svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="lf-error">
                    <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.8" fill="currentColor"/></svg>
                    {error}
                  </div>
                )}

                <button type="submit" className={`lf-btn ${loading ? 'lf-btn--loading' : ''}`} disabled={loading}>
                  {loading ? (
                    <><span className="lf-spinner" /> AUTHENTIFICATION...</>
                  ) : (
                    <><span>SE CONNECTER</span><svg viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                  )}
                </button>
              </form>

              <div className="lf-footer">
                <span className="lf-footer-text">Pas encore de compte ?</span>
                <Link to="/register" className="lf-footer-link">Créer un compte →</Link>
              </div>

              <div className="lf-security">
                <div className="lf-security-dot" />
                <span>JWT · bcrypt · MFA · TLS 1.3</span>
              </div>
            </div>
          ) : (
            <div className="login-form-wrap" key="mfa">
              <div className="login-card-header">
                <button className="login-back" onClick={() => { setStep('login'); setError(''); setMfaCode(['','','','','','']); }}>
                  <svg viewBox="0 0 20 20" fill="none"><path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Retour
                </button>
              </div>

              <div className="mfa-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <polygon points="24,4 44,14 44,34 24,44 4,34 4,14" stroke="#4DFFB4" strokeWidth="1.5" fill="rgba(77,255,180,0.05)"/>
                  <path d="M16 24h16M24 16v16" stroke="#4DFFB4" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="login-title">Vérification MFA</h1>
              <p className="login-subtitle">Code Google Authenticator · {email}</p>

              <div className="mfa-inputs">
                {mfaCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => mfaRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleMfaInput(i, e.target.value)}
                    onKeyDown={e => handleMfaKey(i, e)}
                    className={`mfa-input ${digit ? 'mfa-input--filled' : ''}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <div className="mfa-separator"><span /><span /><span /></div>

              {error && (
                <div className="lf-error">
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.8" fill="currentColor"/></svg>
                  {error}
                </div>
              )}

              <button
                className={`lf-btn ${loading ? 'lf-btn--loading' : ''} ${mfaCode.every(d => d) ? '' : 'lf-btn--disabled'}`}
                onClick={() => handleMfaSubmit()}
                disabled={loading || !mfaCode.every(d => d)}
              >
                {loading ? <><span className="lf-spinner" /> VÉRIFICATION...</> : 'CONFIRMER'}
              </button>

              <p className="mfa-hint">Ouvrez Google Authenticator et entrez le code à 6 chiffres</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
