import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifySuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const type = searchParams.get('type');
  const isPatient = type === 'patient';

  const targetLogin = isPatient ? '/LoginPatients' : '/login';

  const title = isPatient
    ? 'Patient Account Verified!'
    : 'Doctor Account Approved!';

  const message = isPatient
    ? 'Your patient account has been verified successfully. You can now log in and complete your rehabilitation profile.'
    : 'The doctor account has been approved successfully. The doctor can now log in to the platform.';

  const buttonText = isPatient
    ? 'Go to patient login now'
    : 'Go to doctor login now';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    if (countdown === 0) {
      navigate(targetLogin);
    }

    return () => clearInterval(timer);
  }, [countdown, navigate, targetLogin]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      width: '100vw', 
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2"/>
          <path d="M8 12L11 15L16 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '15px' }}>
        {title}
      </h1>
      
      <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '460px', lineHeight: '1.6' }}>
        {message}
      </p>

      <div style={{ 
        marginTop: '40px', 
        padding: '15px 30px', 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>
          You will be redirected in{' '}
          <span style={{ color: '#facc15', fontWeight: 'bold' }}>
            {countdown} seconds
          </span>
          ...
        </p>
      </div>

      <button 
        onClick={() => navigate(targetLogin)}
        style={{
          marginTop: '30px',
          background: 'none',
          border: 'none',
          color: '#8b5cf6',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {buttonText}
      </button>

      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        fontSize: '10px', 
        color: '#334155', 
        letterSpacing: '2px' 
      }}>
        KAWATEK SYSTEMS © 2026
      </div>
    </div>
  );
};

export default VerifySuccess;