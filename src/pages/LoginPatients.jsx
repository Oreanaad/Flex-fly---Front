import React, { useState } from 'react';
import useAuth from '../Context/useAuth';
import { useNavigate } from 'react-router-dom';
import '../css/login.css'; // <--- Importamos el archivo CSS
import ChickenVisual from './ChickenVisual';

const BionicLoginPatients = ({ onLoginSuccess }) => {
  const navigate = useNavigate(); 
  const { loginPatient } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const result = await loginPatient(email, password); 
    setLoading(false);

 if (result.success) {
  setMessage(result.message);

  if (onLoginSuccess) {
    onLoginSuccess(result.patient);
  }

  if (!result.patient.profile_completed) {
    navigate('/complete-patient-profile', {
      state: {
        patient: result.patient,
        patientId: result.patient.clinical_patient_id
      }
    });
  } else {
    navigate('/patient-calibration', {
      state: {
        patient: result.patient,
        patientId: result.patient.clinical_patient_id
      }
    });
  }
} else {
  setMessage(result.message);
}
  };

  return (
    <div className="login-screen-container">
      
      {/* SECCIÓN IZQUIERDA: Identidad */}
      <div className="login-identity-section">
        <div className="chicken-container">
          <ChickenVisual />
        </div>
        <h1 className="login-title">
          Welcome! <br/> Log in and start your
          <span className="highlight-yellow"> Training</span>
        </h1>
        
        
        <p className="login-subtitle">
          Bionic Rehabilitation Software of Kawatek.
        </p>
      </div>

      {/* SECCIÓN DERECHA: Formulario */}
      <div className="login-form-section">
        <div className="login-card">
          <h2 className="login-card-title">Log in</h2>

          <form onSubmit={handleSubmit}>
            <div className="login-form-flex">
              <div className="input-group">
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  placeholder="Your email"
                  className="login-input"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Your password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button 
                onClick={onLoginSuccess}
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>

             
              {message && (
                <p className={`form-message ${message.includes('Redirecting...') || message.includes('éxito') ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}
             
              <div className="form-links">
                <p>
                  <span 
                    onClick={() => navigate('/RegistroPatients')} 
                    className="link-text"
                  >
                    Doesn't have an account? Sign up!
                  </span>
                   <br/>
                  <span 
                        onClick={() => navigate('/forgot-password/patient')} 
                        className="link-text"
                        >
                        Forgot your password?
                        </span>
                </p>
                <span 
            type="button"
            onClick={() => navigate('/login')}
            className="link-text"
            >
            Are you a doctor? Log in as doctor
            </span>
              </div>  
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BionicLoginPatients;