import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clientAPI } from '../../services/clientAPI';
import { analyseAPI } from '../../services/analyseAPI';
import { AnalyseBadge, AnalysePanel, EN_COURS } from '../../components/AnalyseIA';
import '../../components/AnalyseIA.css';

const DOC_TYPES = [
  { value: 'rapport_audit',      label: 'Rapport d\'audit' },
  { value: 'politique_securite', label: 'Politique de sécurité' },
  { value: 'certificat',         label: 'Certificat / attestation' },
  { value: 'export_grc',         label: 'Export GRC' },
  { value: 'autre',              label: 'Autre' },
];

const POLL_MS = 3000;

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [typeDoc, setTypeDoc] = useState('rapport_audit');
  const [analyses, setAnalyses] = useState({});   // { [id_document]: analyse }
  const [scoreDoc, setScoreDoc] = useState(null);
  const [ouvert, setOuvert] = useState(null);     // id_document déplié
  const [sansDossier, setSansDossier] = useState(false);
  const fileRef = useRef();
  const pollRef = useRef(null);
  // null = inconnu, number = id du dossier, false = pas de dossier (on ne redemande plus)
  const dossierRef = useRef(null);

  // Analyses du dossier — une seule requête pour tous les documents.
  const loadAnalyses = useCallback(async () => {
    if (dossierRef.current === false) return;   // compte sans dossier : rien à charger
    try {
      if (dossierRef.current == null) {
        const res = await clientAPI.getDossier();
        dossierRef.current = res.data.id;
      }
      const res = await analyseAPI.getAnalysesDossier(dossierRef.current);
      const parDoc = {};
      res.data.documents.forEach((d) => { parDoc[d.id_document] = d.analyse; });
      setAnalyses(parDoc);
      setScoreDoc(res.data.score_document);
    } catch (err) {
      // 404 sur le dossier : inutile de réessayer à chaque tick
      if (err.response?.status === 404) dossierRef.current = false;
      // module IA indisponible : la page reste utilisable
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setSansDossier(false);
    try {
      const res = await clientAPI.getDocuments();
      setDocuments(res.data.documents);
      setTotal(res.data.total);
      loadAnalyses();
    } catch (err) {
      if (err.response?.status === 404) {
        // Aucun dossier rattaché : ce n'est pas une erreur, c'est un état d'attente
        dossierRef.current = false;
        setSansDossier(true);
      } else {
        setError(err.response?.data?.detail || 'Impossible de charger les documents');
      }
    } finally { setLoading(false); }
  }, [loadAnalyses]);

  useEffect(() => { load(); }, [load]);

  // Tant qu'une analyse tourne, on interroge l'API à intervalle régulier.
  useEffect(() => {
    const enCours = Object.values(analyses)
      .some((a) => a && EN_COURS.includes(a.status));
    if (!enCours) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(loadAnalyses, POLL_MS);
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [analyses, loadAnalyses]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      await clientAPI.uploadDocument(file, typeDoc);
      setSuccess(`"${file.name}" uploadé avec succès`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="cl-page">
      {success && (
        <div className="cl-success">
          <i className="ti ti-circle-check" style={{ fontSize: 18 }} />
          {success}
        </div>
      )}
      {error && <div style={{ color: 'var(--c-red)', fontSize: 13 }}>{error}</div>}

      {/* Aucun dossier rattaché : le compte existe mais aucun courtier ne l'a
          encore relié à un dossier — ce n'est pas une erreur technique. */}
      {sansDossier && (
        <div className="cl-panel">
          <div className="cl-empty">
            <i className="ti ti-folder-off" />
            <p>Aucun dossier n'est encore associé à votre compte.</p>
            <small style={{ color: 'var(--c-text3)', fontSize: 12 }}>
              Votre courtier doit créer un dossier à votre nom avant que vous puissiez
              déposer des preuves documentaires.
            </small>
          </div>
        </div>
      )}

      {/* Upload */}
      {!sansDossier && (
      <div className="cl-panel">
        <div className="cl-panel-header">
          <span className="cl-panel-title">Ajouter un document</span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--c-text3)', fontWeight: 600, marginBottom: 8 }}>
              TYPE DE DOCUMENT
            </div>
            <select
              value={typeDoc}
              onChange={(e) => setTypeDoc(e.target.value)}
              style={{
                background: 'var(--c-bg2)',
                border: '1px solid var(--c-border)',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--c-text)',
                fontSize: 13,
                fontFamily: 'var(--f-display)',
                outline: 'none',
              }}
            >
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div
            className="cl-upload-zone"
            onClick={() => !uploading && fileRef.current?.click()}
            style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
          >
            <i className="ti ti-cloud-upload" />
            {uploading
              ? <p>Upload en cours...</p>
              : <>
                  <p>Cliquer pour sélectionner un fichier</p>
                  <small>PDF, DOCX, TXT, PNG, JPG · max 10 Mo</small>
                </>
            }
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
          </div>
        </div>
      </div>
      )}

      {/* List */}
      {!sansDossier && (
      <div className="cl-panel">
        <div className="cl-panel-header">
          <span className="cl-panel-title">
            Documents uploadés
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>
              {total}
            </span>
          </span>
          {scoreDoc != null && scoreDoc > 0 && (
            <span className="cl-doc-meta">
              Score documentaire : <strong style={{ color: '#4DFFB4' }}>{scoreDoc}</strong>/100
            </span>
          )}
        </div>

        {loading && <div className="cl-loader"><div className="cl-spinner" /></div>}

        {!loading && documents.length > 0 && (
          <div>
            {documents.map((doc) => {
              const analyse = analyses[doc.id_document];
              const consultable = analyse && ['terminee', 'echec'].includes(analyse.status);
              const deplie = ouvert === doc.id_document;
              return (
                <div key={doc.id_document}>
                  <div className="cl-doc-item">
                    <div className="cl-doc-icon"><i className="ti ti-file" /></div>
                    <span className="cl-doc-name">{doc.nom || 'Document'}</span>
                    <span className="cl-doc-meta">{doc.type} · {doc.taille_ko != null ? `${doc.taille_ko} Ko` : '—'}</span>
                    <span className="cl-doc-meta" style={{ marginLeft: 8 }}>{doc.uploaded_at?.slice(0, 10)}</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AnalyseBadge status={analyse?.status} />
                      {consultable && (
                        <button
                          className="ia-doc-toggle"
                          onClick={() => setOuvert(deplie ? null : doc.id_document)}
                          aria-expanded={deplie}
                          aria-label={deplie ? 'Masquer l\'analyse' : 'Voir l\'analyse'}
                        >
                          <i className={`ti ti-chevron-${deplie ? 'up' : 'down'}`} />
                        </button>
                      )}
                    </span>
                  </div>
                  {deplie && (
                    <div style={{ padding: '0 16px' }}>
                      <AnalysePanel analyse={analyse} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="cl-empty"><i className="ti ti-files-off" /><p>Aucun document uploadé</p></div>
        )}
      </div>
      )}
    </div>
  );
}
