import React, { useState, useEffect, useRef } from 'react';
import { clientAPI } from '../../services/clientAPI';

const DOC_TYPES = [
  { value: 'politique_securite', label: 'Politique de sécurité' },
  { value: 'bilan_financier',    label: 'Bilan financier' },
  { value: 'plan_continuite',    label: 'Plan de continuité' },
  { value: 'certificat_assurance', label: 'Certificat d\'assurance' },
  { value: 'rapport_audit',     label: 'Rapport d\'audit' },
  { value: 'autre',             label: 'Autre' },
];

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [typeDoc, setTypeDoc] = useState('autre');
  const fileRef = useRef();

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await clientAPI.getDocuments();
      setDocuments(res.data.documents);
      setTotal(res.data.total);
    } catch { setError('Impossible de charger les documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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

      {/* Upload */}
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
                  <small>PDF, DOCX, PNG, JPG · max 10 Mo</small>
                </>
            }
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="cl-panel">
        <div className="cl-panel-header">
          <span className="cl-panel-title">
            Documents uploadés
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>
              {total}
            </span>
          </span>
        </div>

        {loading && <div className="cl-loader"><div className="cl-spinner" /></div>}

        {!loading && documents.length > 0 && (
          <div>
            {documents.map((doc) => (
              <div key={doc.id_document} className="cl-doc-item">
                <div className="cl-doc-icon"><i className="ti ti-file" /></div>
                <span className="cl-doc-name">{doc.nom || 'Document'}</span>
                <span className="cl-doc-meta">{doc.type} · {doc.taille_ko != null ? `${doc.taille_ko} Ko` : '—'}</span>
                <span className="cl-doc-meta" style={{ marginLeft: 8 }}>{doc.uploaded_at?.slice(0, 10)}</span>
                <i className="ti ti-circle-check" style={{ color: '#4DFFB4', fontSize: 16, marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="cl-empty"><i className="ti ti-files-off" /><p>Aucun document uploadé</p></div>
        )}
      </div>
    </div>
  );
}
