import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../Context/useAuth';
import '../css/login.css';
import ChickenVisual from './ChickenVisual';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { userType } = useParams();

  const {
    forgotPasswordDoctor,
    forgotPasswordPatient
  } = useAuth();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPatient = userType === 'patient';

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setIsSuccess(false);
    setLoading(true);

    const result = isPatient
      ? await forgotPasswordPatient(email)
      : await forgotPasswordDoctor(email);

    setLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setMessage(result.message);
    } else {
      setIsSuccess(false);
      setMessage(result.message);
    }
  };

  return (
    <div className="login-screen-container">
      <div className="login-identity-section">
        <div className="chicken-container">
          <ChickenVisual />
        </div>

        <h1 className="login-title">
          Recover your <br />
          <span className="highlight-yellow">password</span>
        </h1>

        <p className="login-subtitle">
          We will send you a secure reset link by email.
        </p>
      </div>

      <div className="login-form-section">
        <div className="login-card">
          <h2 className="login-card-title">
            Forgot password
          </h2>

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

              <button
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              {message && (
                <p className={`form-message ${isSuccess ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}

              <div className="form-links">
                <p>
                  <span
                    onClick={() => navigate(isPatient ? '/LoginPatients' : '/login')}
                    className="link-text"
                  >
                    Back to login
                  </span>
                </p>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;