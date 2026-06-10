import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const FEATURES = [
  {
    icon: '◈',
    title: 'Analyse IA instantanée',
    desc: 'Vos documents de conformité analysés en moins de 30 minutes par nos agents intelligents.',
    tag: 'IA GÉNÉRATIVE',
  },
  {
    icon: '◉',
    title: 'Score de risque précis',
    desc: 'Moteur de scoring propriétaire combinant questionnaire, preuves documentaires et référentiels.',
    tag: 'ISO 27001',
  },
  {
    icon: '◎',
    title: 'Devis automatisé',
    desc: "Génération de propositions d'assurance calibrées en fonction de votre exposition cyber réelle.",
    tag: 'AUTOMATISATION',
  },
  {
    icon: '▣',
    title: 'Sécurité maximale',
    desc: 'Architecture zero-trust, chiffrement TLS 1.3, MFA obligatoire et journalisation complète.',
    tag: 'ZERO TRUST',
  },
];

const STATS = [
  { value: '98.7', unit: '%', label: 'Précision IA' },
  { value: '<30', unit: 'min', label: 'Délai cotation' },
  { value: '10k+', unit: '', label: 'Dossiers traités' },
  { value: '99.9', unit: '%', label: 'Disponibilité' },
];

const ROLES = [
  { id: 'courtier', label: 'Courtier', color: '#4DFFB4', desc: 'Gérez vos dossiers clients et obtenez des devis en temps réel.' },
  { id: 'assureur', label: 'Assureur', color: '#00D4FF', desc: 'Consultez les scores de risque et validez les propositions.' },
  { id: 'client', label: 'Client', color: '#A78BFA', desc: 'Suivez votre dossier et réduisez votre exposition cyber.' },
  { id: 'admin', label: 'Admin', color: '#FF4466', desc: "Pilotez la plateforme et gérez les accès utilisateurs." },
];

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const [activeRole, setActiveRole] = useState('courtier');
  const [typed, setTyped] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState({});
  const observerRef = useRef(null);

  // Typewriter effect
  const fullText = 'Automatisez votre cyber-assurance.';
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 55);
    return () => clearInterval(interval);
  }, []);

  // Mouse parallax
  useEffect(() => {
    const handle = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  // Canvas — animated grid + particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    let t = 0;
    const draw = () => {
      t += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(77,255,180,0.03)';
      ctx.lineWidth = 1;
      const gs = 60;
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77,255,180,${p.alpha * (0.7 + 0.3 * Math.sin(t + p.x))})`;
        ctx.fill();
      });

      // Connections
      particles.forEach((a, i) => {
        particles.slice(i + 1, i + 8).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(77,255,180,${0.06 * (1 - d / 130)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // Scroll reveal
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.reveal]: true }));
      }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="home">
      <canvas ref={canvasRef} className="home-canvas" />

      {/* Ambient glows */}
      <div className="home-glow home-glow--tl" style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }} />
      <div className="home-glow home-glow--br" style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }} />

      {/* NAV */}
      <nav className="home-nav">
        <div className="home-nav-logo">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#4DFFB4" strokeWidth="1.5" fill="none"/>
            <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" stroke="#4DFFB4" strokeWidth="0.8" fill="rgba(77,255,180,0.04)"/>
            <circle cx="18" cy="18" r="3.5" fill="#4DFFB4"/>
          </svg>
          <span className="home-nav-name">CYBER<strong>INSURE</strong></span>
        </div>
        <div className="home-nav-links">
          <a href="#features" className="home-nav-link">Fonctionnalités</a>
          <a href="#roles" className="home-nav-link">Profils</a>
          <a href="#stats" className="home-nav-link">Chiffres</a>
        </div>
        <button className="home-nav-cta" onClick={() => navigate('/login')}>
          Connexion →
        </button>
      </nav>

      {/* HERO */}
      <section className="home-hero" ref={heroRef}>
        <div className="home-hero-badge">
          <span className="home-hero-badge-dot" />
          PLATEFORME CERTIFIÉE ISO 27001
        </div>

        <h1 className="home-hero-title">
          <span className="home-hero-line1">Cyber-assurance</span>
          <span className="home-hero-line2">
            <span className="home-hero-accent">pilotée par l'IA</span>
          </span>
          <span className="home-hero-typewriter">
            {typed}<span className="home-hero-cursor">|</span>
          </span>
        </h1>

        <p className="home-hero-desc">
          De l'évaluation du risque à la génération du devis, CyberInsure automatise
          l'intégralité du parcours de souscription cyber pour les courtiers, assureurs
          et entreprises clientes.
        </p>

        <div className="home-hero-actions">
          <button className="home-btn-primary" onClick={() => navigate('/register')}>
            <span>Commencer gratuitement</span>
            <svg viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="home-btn-ghost" onClick={() => navigate('/login')}>
            <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7l5 3-5 3V7z" fill="currentColor"/></svg>
            <span>Se connecter</span>
          </button>
        </div>

        <div className="home-hero-scroll">
          <div className="home-hero-scroll-line" />
          <span>SCROLL</span>
        </div>

        {/* Floating card */}
        <div className="home-float-card" style={{ transform: `translate(${mousePos.x * 10 - 5}px, ${mousePos.y * 10 - 5}px)` }}>
          <div className="home-float-header">
            <span className="home-float-dot" />
            <span className="home-float-label">ANALYSE EN COURS</span>
          </div>
          <div className="home-float-progress">
            <div className="home-float-bar">
              <div className="home-float-fill" />
            </div>
            <span className="home-float-pct">73%</span>
          </div>
          <div className="home-float-tags">
            <span className="home-float-tag home-float-tag--green">ISO 27001 ✓</span>
            <span className="home-float-tag home-float-tag--blue">RGPD ✓</span>
            <span className="home-float-tag home-float-tag--orange">SOC2 ~</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats" id="stats" data-reveal="stats" style={{ opacity: visible.stats ? 1 : 0, transform: visible.stats ? 'none' : 'translateY(30px)', transition: 'all 0.7s ease' }}>
        {STATS.map((s, i) => (
          <div key={i} className="home-stat" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="home-stat-value">
              {s.value}<span className="home-stat-unit">{s.unit}</span>
            </div>
            <div className="home-stat-label">{s.label}</div>
            <div className="home-stat-line" />
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="home-features" id="features">
        <div className="home-section-label" data-reveal="feat-label" style={{ opacity: visible['feat-label'] ? 1 : 0, transform: visible['feat-label'] ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
          FONCTIONNALITÉS CLÉS
        </div>
        <h2 className="home-section-title" data-reveal="feat-title" style={{ opacity: visible['feat-title'] ? 1 : 0, transform: visible['feat-title'] ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease 0.1s' }}>
          Tout ce dont vous avez besoin<br />pour assurer la cyber.
        </h2>
        <div className="home-features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="home-feat-card"
              data-reveal={`feat-${i}`}
              style={{
                opacity: visible[`feat-${i}`] ? 1 : 0,
                transform: visible[`feat-${i}`] ? 'none' : 'translateY(32px)',
                transition: `all 0.6s ease ${i * 0.12}s`
              }}
            >
              <div className="home-feat-top">
                <span className="home-feat-icon">{f.icon}</span>
                <span className="home-feat-tag">{f.tag}</span>
              </div>
              <h3 className="home-feat-title">{f.title}</h3>
              <p className="home-feat-desc">{f.desc}</p>
              <div className="home-feat-line" />
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="home-roles" id="roles">
        <div className="home-section-label" data-reveal="roles-label" style={{ opacity: visible['roles-label'] ? 1 : 0, transform: visible['roles-label'] ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
          PROFILS UTILISATEURS
        </div>
        <h2 className="home-section-title" data-reveal="roles-title" style={{ opacity: visible['roles-title'] ? 1 : 0, transform: visible['roles-title'] ? 'none' : 'translateY(24px)', transition: 'all 0.6s ease 0.1s' }}>
          Une plateforme, quatre profils.
        </h2>

        <div className="home-roles-tabs" data-reveal="roles-tabs" style={{ opacity: visible['roles-tabs'] ? 1 : 0, transform: visible['roles-tabs'] ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease 0.2s' }}>
          {ROLES.map(r => (
            <button
              key={r.id}
              className={`home-role-tab ${activeRole === r.id ? 'home-role-tab--active' : ''}`}
              style={activeRole === r.id ? { borderColor: r.color, color: r.color, background: r.color + '12' } : {}}
              onClick={() => setActiveRole(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {ROLES.filter(r => r.id === activeRole).map(r => (
          <div key={r.id} className="home-role-panel">
            <div className="home-role-color" style={{ background: r.color }} />
            <div className="home-role-content">
              <h3 className="home-role-name" style={{ color: r.color }}>{r.label}</h3>
              <p className="home-role-desc">{r.desc}</p>
              <button className="home-role-cta" style={{ color: r.color, borderColor: r.color + '40', background: r.color + '08' }} onClick={() => navigate(r.id === 'admin' || r.id === 'assureur' ? '/login' : '/register')}>
                {r.id === 'admin' || r.id === 'assureur' ? 'Se connecter' : 'Créer un compte'} →
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* CTA FINAL */}
      <section className="home-cta" data-reveal="cta" style={{ opacity: visible['cta'] ? 1 : 0, transform: visible['cta'] ? 'none' : 'translateY(32px)', transition: 'all 0.8s ease' }}>
        <div className="home-cta-card">
          <div className="home-cta-glow" />
          <div className="home-cta-corner tl" /><div className="home-cta-corner tr" />
          <div className="home-cta-corner bl" /><div className="home-cta-corner br" />
          <h2 className="home-cta-title">Prêt à automatiser votre<br /><span>souscription cyber ?</span></h2>
          <p className="home-cta-sub">Rejoignez les courtiers et entreprises qui font confiance à CyberInsure.</p>
          <div className="home-cta-btns">
            <button className="home-btn-primary home-btn-primary--large" onClick={() => navigate('/register')}>
              <span>Démarrer maintenant</span>
              <svg viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="home-btn-ghost" onClick={() => navigate('/login')}>
              <span>Déjà un compte ? Se connecter</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="home-footer-logo">
          <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
            <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#4DFFB4" strokeWidth="1.5" fill="none"/>
            <circle cx="18" cy="18" r="3.5" fill="#4DFFB4"/>
          </svg>
          <span>CYBER<strong>INSURE</strong></span>
        </div>
        <span className="home-footer-copy">© 2026 CyberInsure — Plateforme de cyber-assurance</span>
        <div className="home-footer-badges">
          <span>JWT</span><span>bcrypt</span><span>MFA</span><span>TLS 1.3</span>
        </div>
      </footer>
    </div>
  );
}
