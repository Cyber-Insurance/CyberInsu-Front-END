import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI } from '../../services/adminAPI';
import { analyseAPI } from '../../services/analyseAPI';
import { ANALYSE_STATUS_LABELS } from '../../components/AnalyseIA';

const RISK_COLOR = {
  minimal: '#00D4FF', faible: '#4DFFB4', moyen: '#FFB347', eleve: '#FF8C42',
  critique: '#FF4466', non_evalue: '#888',
};
const RUN_STATUS = {
  success: { color: '#4DFFB4', label: 'Succès' },
  partial: { color: '#FFB347', label: 'Partiel (Open Data indispo)' },
  failed:  { color: '#FF4466', label: 'Échec' },
  running: { color: '#00D4FF', label: 'En cours…' },
};

function riskColor(niveau) {
  const key = (niveau || '').toLowerCase().replace(/é/g, 'e');
  return RISK_COLOR[key] || '#888';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [secteurs, setSecteurs] = useState([]);
  const [runs, setRuns] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [ia, setIa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [launching, setLaunching] = useState(false);
  const pollRef = useRef(null);

  const loadAll = useCallback(() => {
    Promise.allSettled([
      adminAPI.getAnalyticsOverview(),
      adminAPI.getAnalyticsSecteurs(),
      adminAPI.getEtlRuns(),
      adminAPI.getAnalyticsPredictions(),
      analyseAPI.getStats(),
    ]).then(([ov, sec, rn, pr, an]) => {
      if (ov.status === 'fulfilled') { setOverview(ov.value.data); setEmpty(false); }
      else setEmpty(true);
      if (sec.status === 'fulfilled') setSecteurs(sec.value.data.secteurs || []);
      if (rn.status === 'fulfilled') setRuns(rn.value.data.runs || []);
      if (pr.status === 'fulfilled') setPredictions(pr.value.data);
      if (an.status === 'fulfilled') setIa(an.value.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadAll();
    return () => clearInterval(pollRef.current);
  }, [loadAll]);

  const launchRun = async () => {
    setLaunching(true);
    try {
      await adminAPI.runEtl();
      // Polling jusqu'à la fin du run
      pollRef.current = setInterval(async () => {
        try {
          const r = await adminAPI.getEtlRuns();
          const list = r.data.runs || [];
          setRuns(list);
          if (list.length && list[0].status !== 'running') {
            clearInterval(pollRef.current);
            setLaunching(false);
            loadAll();
          }
        } catch { /* on retente au tick suivant */ }
      }, 3000);
    } catch {
      setLaunching(false);
    }
  };

  if (loading) return <div className="adm-loader"><div className="adm-spinner" /></div>;

  const kpi = overview?.kpi || {};
  const totalRisque = (overview?.repartition_risque || []).reduce((s, r) => s + r.nb, 0);
  const maxExpo = Math.max(...secteurs.map(s => s.indice_exposition || 0), 1);

  const CARDS = [
    { label: 'Dossiers (mart)',   value: kpi.nb_dossiers ?? '—',                                icon: 'ti-folder',        color: '#00D4FF' },
    { label: 'Complétude moy.',   value: kpi.completude_moyenne != null ? `${kpi.completude_moyenne}%` : '—', icon: 'ti-progress-check', color: '#4DFFB4' },
    { label: 'Score moyen',       value: kpi.score_moyen ?? '—',                                icon: 'ti-gauge',         color: '#A78BFA' },
    { label: 'Avec devis',        value: kpi.nb_avec_devis ?? '—',                              icon: 'ti-file-invoice',  color: '#FFB347' },
  ];

  return (
    <div className="adm-page fade-in">
      {/* Bandeau ETL */}
      <div className="adm-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="adm-panel-title">
            <i className="ti ti-refresh" style={{ marginRight: 6, color: '#00D4FF' }} aria-hidden="true" />
            Pipeline ETL — data mart analytics
          </h2>
          <p style={{ fontSize: 12, color: 'var(--c-text3, rgba(255,255,255,0.4))', margin: '6px 0 0' }}>
            Sources : base interne · exports GRC · Open Data (CISA KEV{overview?.dernier_run ? ` — dernier run #${overview.dernier_run.id_run} ${fmtDate(overview.dernier_run.finished_at)}` : ''})
          </p>
        </div>
        <button
          className="adm-btn adm-btn--primary"
          onClick={launchRun}
          disabled={launching}
          style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #00D4FF55',
                   background: launching ? 'transparent' : '#00D4FF22', color: '#00D4FF',
                   cursor: launching ? 'wait' : 'pointer', fontFamily: 'inherit' }}
        >
          <i className={`ti ${launching ? 'ti-loader-2' : 'ti-player-play'}`} style={{ marginRight: 6 }} aria-hidden="true" />
          {launching ? 'Run en cours…' : 'Lancer un run ETL'}
        </button>
      </div>

      {empty ? (
        <div className="adm-panel" style={{ textAlign: 'center', padding: 40 }}>
          <i className="ti ti-database-off" style={{ fontSize: 32, color: '#FFB347' }} aria-hidden="true" />
          <p style={{ marginTop: 12 }}>Data mart non initialisé — lancez un premier run ETL.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="adm-kpi-grid">
            {CARDS.map((c, i) => (
              <div key={i} className="adm-kpi-card" style={{ '--k': c.color }}>
                <div className="adm-kpi-top">
                  <i className={`ti ${c.icon}`} style={{ color: c.color }} aria-hidden="true" />
                  <span className="adm-kpi-label">{c.label}</span>
                </div>
                <div className="adm-kpi-value">{c.value}</div>
                <div className="adm-kpi-bar"><div className="adm-kpi-bar-fill" /></div>
              </div>
            ))}
          </div>

          <div className="adm-two-col">
            {/* Répartition des niveaux de risque */}
            <div className="adm-panel">
              <div className="adm-panel-header">
                <h2 className="adm-panel-title">
                  <i className="ti ti-alert-triangle" style={{ marginRight: 6, color: '#FF4466' }} aria-hidden="true" />
                  Niveaux de risque
                </h2>
              </div>
              <div className="adm-roles-chart">
                {(overview?.repartition_risque || []).map(({ niveau, nb }) => {
                  const pct = totalRisque > 0 ? (nb / totalRisque * 100).toFixed(1) : 0;
                  const col = riskColor(niveau);
                  return (
                    <div key={niveau} className="adm-role-row">
                      <div className="adm-role-info">
                        <span className="adm-role-dot" style={{ background: col }} />
                        <span className="adm-role-name">{niveau}</span>
                        <span className="adm-role-count">{nb}</span>
                      </div>
                      <div className="adm-role-bar-wrap">
                        <div className="adm-role-bar">
                          <div className="adm-role-fill" style={{ width: `${pct}%`, background: col }} />
                        </div>
                        <span className="adm-role-pct" style={{ color: col }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exposition menaces par secteur (Open Data) */}
            <div className="adm-panel">
              <div className="adm-panel-header">
                <h2 className="adm-panel-title">
                  <i className="ti ti-world" style={{ marginRight: 6, color: '#FFB347' }} aria-hidden="true" />
                  Exposition menaces par secteur <span style={{ fontSize: 10, color: 'var(--c-text3, rgba(255,255,255,0.4))' }}>(CISA KEV)</span>
                </h2>
              </div>
              <div className="adm-roles-chart">
                {secteurs.map(s => {
                  const expo = s.indice_exposition || 0;
                  const pct = (expo / maxExpo * 100).toFixed(1);
                  return (
                    <div key={s.secteur} className="adm-role-row">
                      <div className="adm-role-info">
                        <span className="adm-role-dot" style={{ background: '#FFB347' }} />
                        <span className="adm-role-name">{s.secteur}</span>
                        <span className="adm-role-count">{s.nb_dossiers} dossier(s)</span>
                      </div>
                      <div className="adm-role-bar-wrap">
                        <div className="adm-role-bar">
                          <div className="adm-role-fill" style={{ width: `${pct}%`, background: '#FFB347' }} />
                        </div>
                        <span className="adm-role-pct" style={{ color: '#FFB347' }}>{expo}</span>
                      </div>
                    </div>
                  );
                })}
                {secteurs.length === 0 && <p style={{ fontSize: 12, opacity: 0.6 }}>Aucun secteur dans le data mart.</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Surveillance du modèle ML */}
      {predictions && predictions.total_predictions > 0 && (
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2 className="adm-panel-title">
              <i className="ti ti-brain" style={{ marginRight: 6, color: '#00D4FF' }} aria-hidden="true" />
              Surveillance du modèle de scoring
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, marginBottom: 12 }}>
            <span>Prédictions : <strong style={{ color: '#00D4FF' }}>{predictions.total_predictions}</strong></span>
            <span>Latence moyenne : <strong style={{ color: '#4DFFB4' }}>{predictions.latence_moyenne_ms ?? '—'} ms</strong></span>
          </div>
          <div className="adm-roles-chart">
            {(predictions.repartition_classes || []).map(({ classe_predite, nb }) => {
              const col = riskColor(classe_predite);
              const pct = (nb / predictions.total_predictions * 100).toFixed(1);
              return (
                <div key={classe_predite} className="adm-role-row">
                  <div className="adm-role-info">
                    <span className="adm-role-dot" style={{ background: col }} />
                    <span className="adm-role-name">{classe_predite}</span>
                    <span className="adm-role-count">{nb}</span>
                  </div>
                  <div className="adm-role-bar-wrap">
                    <div className="adm-role-bar">
                      <div className="adm-role-fill" style={{ width: `${pct}%`, background: col }} />
                    </div>
                    <span className="adm-role-pct" style={{ color: col }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Surveillance du module d'analyse documentaire (IA générative) */}
      {ia && ia.total_analyses > 0 && (
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2 className="adm-panel-title">
              <i className="ti ti-sparkles" style={{ marginRight: 6, color: '#A78BFA' }} aria-hidden="true" />
              Surveillance du module d'analyse documentaire
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, marginBottom: 12 }}>
            <span>Analyses : <strong style={{ color: '#A78BFA' }}>{ia.total_analyses}</strong></span>
            <span>Latence moyenne : <strong style={{ color: '#4DFFB4' }}>{ia.latence_moyenne_ms} ms</strong></span>
            <span>Tokens : <strong style={{ color: '#00D4FF' }}>
              {(ia.tokens_entree_total + ia.tokens_sortie_total).toLocaleString('fr-FR')}
            </strong> ({ia.tokens_entree_total.toLocaleString('fr-FR')} entrée / {ia.tokens_sortie_total.toLocaleString('fr-FR')} sortie)</span>
            <span>Confiance moyenne : <strong style={{ color: '#FFB347' }}>
              {Math.round((ia.confiance_moyenne || 0) * 100)}%
            </strong></span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.entries(ia.repartition_provider || {}).map(([p, nb]) => (
              <span key={p} style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#A78BFA',
                                     background: 'rgba(167,139,250,0.1)', padding: '3px 9px', borderRadius: 6 }}>
                {p} : {nb}
              </span>
            ))}
          </div>
          <div className="adm-roles-chart">
            {Object.entries(ia.repartition_status || {}).map(([statut, nb]) => {
              const col = { terminee: '#4DFFB4', echec: '#FF4466', en_cours: '#00D4FF',
                            en_attente: '#FFB347' }[statut] || '#888';
              const pct = (nb / ia.total_analyses * 100).toFixed(1);
              return (
                <div key={statut} className="adm-role-row">
                  <div className="adm-role-info">
                    <span className="adm-role-dot" style={{ background: col }} />
                    <span className="adm-role-name">{ANALYSE_STATUS_LABELS[statut] || statut}</span>
                    <span className="adm-role-count">{nb}</span>
                  </div>
                  <div className="adm-role-bar-wrap">
                    <div className="adm-role-bar">
                      <div className="adm-role-fill" style={{ width: `${pct}%`, background: col }} />
                    </div>
                    <span className="adm-role-pct" style={{ color: col }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historique des runs ETL */}
      <div className="adm-panel">
        <div className="adm-panel-header">
          <h2 className="adm-panel-title">
            <i className="ti ti-history" style={{ marginRight: 6, color: '#A78BFA' }} aria-hidden="true" />
            Historique des runs ETL
          </h2>
        </div>
        <div className="adm-timeline">
          {runs.map(r => {
            const cfg = RUN_STATUS[r.status] || { color: '#888', label: r.status };
            return (
              <div key={r.id_run} className="adm-timeline-row">
                <div className="adm-timeline-icon" style={{ color: cfg.color, background: cfg.color + '15', borderColor: cfg.color + '30' }}>
                  <i className="ti ti-refresh" aria-hidden="true" />
                </div>
                <div className="adm-timeline-info">
                  <span className="adm-timeline-action">Run #{r.id_run} — {cfg.label}</span>
                  <span className="adm-timeline-user">
                    {r.lignes_traitees} lignes
                    {r.sources?.cisa_kev ? ` · KEV: ${r.sources.cisa_kev}` : ''}
                    {r.erreur ? ` · ${r.erreur}` : ''}
                  </span>
                </div>
                <span className="adm-timeline-date">{fmtDate(r.finished_at || r.started_at)}</span>
              </div>
            );
          })}
          {runs.length === 0 && <p style={{ fontSize: 12, opacity: 0.6 }}>Aucun run pour l'instant.</p>}
        </div>
      </div>
    </div>
  );
}
