import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:'16px' }}>
      <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
        <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="#4DFFB4" strokeWidth="1.5" fill="none" strokeDasharray="80" strokeDashoffset="80" style={{ animation:'spin 2s linear infinite' }}/>
        <circle cx="18" cy="18" r="4" fill="#4DFFB4"/>
      </svg>
      <span style={{ fontFamily:'var(--f-mono)', fontSize:'11px', color:'var(--c-text3)', letterSpacing:'0.15em' }}>CHARGEMENT...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
