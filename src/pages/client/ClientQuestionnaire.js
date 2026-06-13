import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clientAPI } from '../../services/clientAPI';

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const SECTIONS = {
  profil:        { label: 'Profil',         icon: 'ti-building'        },
  infrastructure:{ label: 'Infrastructure', icon: 'ti-server'          },
  securite:      { label: 'Sécurité',       icon: 'ti-shield-lock'     },
  gouvernance:   { label: 'Gouvernance',    icon: 'ti-clipboard-check' },
  incidents:     { label: 'Incidents',      icon: 'ti-alert-triangle'  },
  general:       { label: 'Général',        icon: 'ti-help-circle'     },
};

const MATURITY = {
  inconnu:       { label: 'Non évalué',    color: 'var(--c-text3)',  bg: 'rgba(255,255,255,0.06)' },
  debutant:      { label: 'Débutant',      color: '#F97316',         bg: 'rgba(249,115,22,0.12)' },
  intermediaire: { label: 'Intermédiaire', color: '#EAB308',         bg: 'rgba(234,179,8,0.12)'  },
  avance:        { label: 'Avancé',        color: '#22C55E',         bg: 'rgba(34,197,94,0.12)'  },
  expert:        { label: 'Expert',        color: '#A78BFA',         bg: 'rgba(167,139,250,0.12)'},
};

const RISK_COLORS = {
  Critique: '#EF4444',
  'Élevé':  '#F97316',
  Moyen:    '#EAB308',
  Faible:   '#22C55E',
  Minimal:  '#A78BFA',
};

function scoreToMaturity(score) {
  if (score == null) return 'inconnu';
  if (score < 30) return 'debutant';
  if (score < 55) return 'intermediaire';
  if (score < 75) return 'avance';
  return 'expert';
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────

export default function ClientQuestionnaire({ dossier, onSuccess }) {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions]         = useState([]);
  const [visibility, setVisibility]       = useState({});
  const [reponses, setReponses]           = useState({});
  const [maturity, setMaturity]           = useState('inconnu');
  const [step, setStep]                   = useState(0);
  const [loading, setLoading]             = useState(true);
  const [evaluating, setEvaluating]       = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitResult, setSubmitResult]   = useState(null); // score après soumission
  const [error, setError]                 = useState('');

  const debounceRef = useRef(null);

  // ── Chargement initial ────────────────────────────────────────────
  useEffect(() => {
    clientAPI.getQuestionnaire()
      .then((r) => {
        const data = r.data;
        setQuestionnaire(data);
        setQuestions(data.questions || []);

        const initVis = {};
        (data.questions || []).forEach((q) => {
          initVis[String(q.id_question)] = q.visible !== false;
        });
        setVisibility(initVis);

        const existing = {};
        Object.entries(data.reponses_existantes || {}).forEach(([k, v]) => {
          existing[parseInt(k, 10)] = v;
        });
        setReponses(existing);

        // Si déjà soumis, initialiser la maturité depuis le dossier parent
        if (dossier?.score != null) {
          setMaturity(scoreToMaturity(dossier.score));
        }
      })
      .catch(() => setError('Impossible de charger le questionnaire'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  // ── Questions visibles ────────────────────────────────────────────
  const visibleQuestions = questions.filter(
    (q) => visibility[String(q.id_question)] !== false
  );
  const current = visibleQuestions[step];

  // ── Ré-évaluation après chaque réponse ───────────────────────────
  const evaluateWithDebounce = useCallback((newReponses) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setEvaluating(true);
      try {
        const payload = {};
        Object.entries(newReponses).forEach(([k, v]) => {
          payload[String(k)] = String(v);
        });
        const res = await clientAPI.evaluateQuestionnaire(payload);
        setVisibility(res.data.visibility);
        setMaturity(res.data.maturity);
      } catch (_) {
        // silently ignore evaluate errors
      } finally {
        setEvaluating(false);
      }
    }, 300);
  }, []);

  const handleAnswer = (questionId, value) => {
    const newReponses = { ...reponses, [questionId]: value };
    setReponses(newReponses);
    evaluateWithDebounce(newReponses);
  };

  const handleAutoAdvance = (questionId, value) => {
    handleAnswer(questionId, value);
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, visibleQuestions.length - 1));
    }, 350);
  };

  // ── Soumission ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const body = Object.entries(reponses)
        .filter(([id]) => visibility[String(id)] !== false)
        .map(([id, val]) => ({
          id_question: parseInt(id, 10),
          valeur: String(val),
        }));
      const res = await clientAPI.soumettreQuestionnaire(body);
      setSubmitResult(res.data);
      // Rafraîchit le dossier parent (score visible dans Overview)
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lors de la soumission');
      setSubmitting(false);
    }
  };

  // ── Stats par section ─────────────────────────────────────────────
  const sectionStats = (sectionKey) => {
    const qs = visibleQuestions.filter((q) => (q.section || 'general') === sectionKey);
    const answered = qs.filter((q) => reponses[q.id_question] !== undefined).length;
    return { total: qs.length, answered };
  };

  const sectionsPresentes = [...new Set(visibleQuestions.map((q) => q.section || 'general'))];
  const totalAnswered = visibleQuestions.filter((q) => reponses[q.id_question] !== undefined).length;
  const progression = visibleQuestions.length > 0
    ? Math.round((totalAnswered / visibleQuestions.length) * 100)
    : 0;

  // ─── ÉTATS VISUELS ───────────────────────────────────────────────

  if (loading) {
    return <div className="cl-loader"><div className="cl-spinner" /></div>;
  }

  if (error && !questionnaire) {
    return (
      <div className="cl-empty" style={{ color: 'var(--c-red)' }}>
        <i className="ti ti-alert-circle" />
        <p>{error}</p>
      </div>
    );
  }

  // Écran de résultat après soumission
  if (submitResult) {
    return (
      <SuccessView
        result={submitResult}
        onRetour={() => setSubmitResult(null)}
      />
    );
  }

  if (!current) return null;

  const mat = MATURITY[maturity] || MATURITY.inconnu;
  const currentSection = current.section || 'general';
  const sectionInfo = SECTIONS[currentSection] || SECTIONS.general;
  const isLast = step === visibleQuestions.length - 1;
  const hiddenCount = questions.length - visibleQuestions.length;

  // Score déjà existant (soumission précédente)
  const hasExistingScore = dossier?.score != null && dossier?.questionnaire_complete;

  return (
    <div className="cl-page">

      {/* ── Bannière score existant ─────────────────────────── */}
      {hasExistingScore && (
        <div className="cl-q-score-banner">
          <div className="cl-q-score-banner-left">
            <i className="ti ti-shield-check" />
            <div>
              <div className="cl-q-score-banner-title">Questionnaire déjà soumis</div>
              <div className="cl-q-score-banner-sub">
                Vous pouvez modifier vos réponses et soumettre à nouveau pour mettre à jour votre score.
              </div>
            </div>
          </div>
          <div className="cl-q-score-banner-score">
            <span className="cl-q-score-banner-value">{dossier.score}</span>
            <span className="cl-q-score-banner-max">/100</span>
            <span
              className="cl-q-score-banner-risk"
              style={{ color: RISK_COLORS[dossier.niveau_risque] || '#A78BFA' }}
            >
              {dossier.niveau_risque}
            </span>
          </div>
        </div>
      )}

      {/* ── En-tête ─────────────────────────────────────────── */}
      <div className="cl-q-header">
        <div className="cl-q-title-row">
          <span className="cl-q-title">{questionnaire?.nom || 'Questionnaire cyber'}</span>
          <span
            className="cl-q-maturity-badge"
            style={{ color: mat.color, background: mat.bg }}
            title="Votre niveau de maturité cyber estimé"
          >
            <i className="ti ti-shield" style={{ marginRight: 5 }} />
            {mat.label}
            {evaluating && <span className="cl-q-evaluating-dot" />}
          </span>
        </div>

        {/* Progression globale */}
        <div className="cl-q-progress-wrap" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <span className="cl-q-progress-label">
            {totalAnswered} / {visibleQuestions.length} répondu{totalAnswered > 1 ? 's' : ''}
          </span>
          <div className="cl-q-progress-bar">
            <div
              className="cl-q-progress-fill"
              style={{ width: `${progression}%`, transition: 'width 0.4s ease' }}
            />
          </div>
          <span className="cl-q-progress-label">{progression}%</span>
        </div>

        {/* Onglets de sections */}
        <div className="cl-q-sections">
          {sectionsPresentes.map((sk) => {
            const si = SECTIONS[sk] || SECTIONS.general;
            const stats = sectionStats(sk);
            const isActive = currentSection === sk;
            const isDone = stats.total > 0 && stats.answered === stats.total;
            return (
              <button
                key={sk}
                className={`cl-q-section-tab${isActive ? ' cl-q-section-tab--active' : ''}${isDone ? ' cl-q-section-tab--done' : ''}`}
                onClick={() => {
                  const firstIdx = visibleQuestions.findIndex((q) => (q.section || 'general') === sk);
                  if (firstIdx >= 0) setStep(firstIdx);
                }}
                title={`${si.label} — ${stats.answered}/${stats.total}`}
              >
                <i className={`ti ${si.icon}`} />
                <span className="cl-q-section-label">{si.label}</span>
                {isDone && <i className="ti ti-check cl-q-section-check" />}
              </button>
            );
          })}
          {hiddenCount > 0 && (
            <span className="cl-q-hidden-hint" title="Questions non pertinentes pour votre profil">
              <i className="ti ti-eye-off" /> {hiddenCount} masquée{hiddenCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--c-red)', fontSize: 13, marginBottom: 8 }}>{error}</div>
      )}

      {/* ── Carte question ──────────────────────────────────── */}
      <div className="cl-q-card">
        <div className="cl-q-card-meta">
          <span className="cl-q-section-badge">
            <i className={`ti ${sectionInfo.icon}`} style={{ marginRight: 5 }} />
            {sectionInfo.label}
          </span>
          <span className="cl-q-counter">
            {step + 1} <span style={{ opacity: 0.45 }}>/ {visibleQuestions.length}</span>
          </span>
        </div>

        {current.contexte_hint && (
          <div className="cl-q-context-hint">
            <i className="ti ti-tag" style={{ marginRight: 5 }} />
            {current.contexte_hint}
          </div>
        )}

        <div className="cl-q-text">{current.texte}</div>

        {current.type === 'boolean' && (
          <div className="cl-options">
            {['oui', 'non'].map((v) => (
              <button
                key={v}
                className={`cl-option-btn ${reponses[current.id_question] === v ? 'cl-option-btn--selected' : ''}`}
                onClick={() => handleAutoAdvance(current.id_question, v)}
              >
                {v === 'oui' ? 'Oui' : 'Non'}
              </button>
            ))}
          </div>
        )}

        {current.type === 'scale' && (
          <div>
            <div className="cl-scale-row">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  className={`cl-scale-btn ${reponses[current.id_question] === String(v) ? 'cl-scale-btn--selected' : ''}`}
                  onClick={() => handleAnswer(current.id_question, String(v))}
                >
                  {v}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--c-text3)', letterSpacing: '0.08em' }}>FAIBLE</span>
              <span style={{ fontSize: 10, color: 'var(--c-text3)', letterSpacing: '0.08em' }}>ÉLEVÉ</span>
            </div>
          </div>
        )}

        {current.type === 'choix_multiple' && current.options && (
          <div className="cl-options">
            {current.options.map((opt) => (
              <button
                key={opt}
                className={`cl-option-btn ${reponses[current.id_question] === opt ? 'cl-option-btn--selected' : ''}`}
                onClick={() => handleAutoAdvance(current.id_question, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {current.type === 'text' && (
          <textarea
            className="cl-text-input"
            rows={3}
            value={reponses[current.id_question] || ''}
            onChange={(e) => handleAnswer(current.id_question, e.target.value)}
            placeholder="Votre réponse…"
          />
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <div className="cl-q-nav">
        <button
          className="cl-btn-ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <i className="ti ti-arrow-left" /> Précédent
        </button>

        {!isLast ? (
          <button className="cl-btn-primary" onClick={() => setStep((s) => s + 1)}>
            Suivant <i className="ti ti-arrow-right" />
          </button>
        ) : (
          <button className="cl-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Envoi…' : <><i className="ti ti-send" /> Soumettre</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ÉCRAN DE RÉSULTAT ────────────────────────────────────────────────────────

function SuccessView({ result, onRetour }) {
  const score = result?.score_global ?? 0;
  const matKey = scoreToMaturity(score);
  const mat = MATURITY[matKey] || MATURITY.inconnu;
  const niveauColor = RISK_COLORS[result?.niveau_risque] || '#A78BFA';

  return (
    <div className="cl-page">
      <div className="cl-success">
        <i className="ti ti-circle-check" style={{ fontSize: 20 }} />
        Questionnaire soumis et score sauvegardé !
      </div>

      <div className="cl-devis-card">
        <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--c-text3)', fontWeight: 600, marginBottom: 12 }}>
          SCORE DE MATURITÉ CYBER
        </div>
        <div className="cl-devis-prime">
          {score}<span> /100</span>
        </div>
        <div className="cl-devis-label" style={{ color: niveauColor }}>
          RISQUE : {result?.niveau_risque?.toUpperCase() || '—'}
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--c-text3)' }}>Maturité :</span>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: mat.color, background: mat.bg,
            padding: '3px 12px', borderRadius: 99
          }}>
            {mat.label}
          </span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--c-text3)', textAlign: 'center' }}>
          Votre score a été enregistré. Consultez votre dossier pour plus de détails.
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button className="cl-btn-ghost" onClick={onRetour}>
          <i className="ti ti-edit" /> Modifier mes réponses
        </button>
      </div>
    </div>
  );
}
