import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../Context/useAuth';
import '../css/login.css';
import ChickenVisual from './ChickenVisual';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { userType, token } = useParams();

  const {
    resetPasswordDoctor,
    resetPasswordPatient
  } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPatient = userType === 'patient';

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setIsSuccess(false);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    const result = isPatient
      ? await resetPasswordPatient(token, password)
      : await resetPasswordDoctor(token, password);

    setLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setMessage(result.message);

      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate(isPatient ? '/LoginPatients' : '/login');
      }, 2000);

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
          Create a new <br />
          <span className="highlight-yellow">password</span>
        </h1>

        <p className="login-subtitle">
          Choose a secure password for your Kawatek account.
        </p>
      </div>

      <div className="login-form-section">
        <div className="login-card">
          <h2 className="login-card-title">
            Reset password
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="login-form-flex">

              <div className="input-group">
                <label className="input-label">New password</label>
                <input 
                  type="password" 
                  placeholder="New password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm password</label>
                <input 
                  type="password" 
                  placeholder="Confirm password"
                  className="login-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>

              {message && (
                <p className={`form-message ${isSuccess ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}

            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;