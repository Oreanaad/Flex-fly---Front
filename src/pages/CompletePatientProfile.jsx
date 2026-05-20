import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/Registro.css';
import ChickenVisual from './ChickenVisual';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CompletePatientProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const patientFromState =
    location.state?.patient ||
    JSON.parse(localStorage.getItem('patient') || 'null');

  const [name, setName] = useState(patientFromState?.name || patientFromState?.username || '');
  const [age, setAge] = useState(patientFromState?.age || '');
  const [affectedSide, setAffectedSide] = useState(patientFromState?.affected_side || '');
  const [condition, setCondition] = useState(patientFromState?.condition || '');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const patientUserId = patientFromState?.patient_user_id || patientFromState?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setIsSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/patient-users/complete-profile/${patientUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          age,
          affected_side: affectedSide,
          condition
        })
      });

      const data = await response.json();

      setLoading(false);

      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message);

        const updatedPatient = {
          ...patientFromState,
          clinical_patient_id: data.patient.id,
          name: data.patient.name,
          age: data.patient.age,
          affected_side: data.patient.affected_side,
          condition: data.patient.condition,
          profile_completed: true
        };

        localStorage.setItem('patient', JSON.stringify(updatedPatient));
        localStorage.setItem('patientId', data.patient.id);

        setTimeout(() => {
          navigate('/patient-calibration', {
            state: {
              patient: updatedPatient,
              patientId: data.patient.id
            }
          });
        }, 1200);

      } else {
        setIsSuccess(false);
        setMessage(data.message);
      }

    } catch (error) {
      console.error('Complete profile error:', error);

      setLoading(false);
      setIsSuccess(false);
      setMessage('Server error while completing patient profile.');
    }
  };

  if (!patientFromState) {
    return (
      <div className="registro-screen-container">
        <div className="registro-card">
          <h2 className="registro-card-title">Patient not found</h2>
          <p className="form-message error">
            Please log in again to complete your profile.
          </p>
          <button
            type="button"
            className="registro-button"
            onClick={() => navigate('/LoginPatients')}
          >
            Back to patient login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registro-screen-container">
      <div className="registro-identity-section">
        <div className="chicken-container">
          <ChickenVisual />
        </div>

        <h1 className="registro-title">
          Complete your<br />
          <span className="highlight-yellow">patient profile</span>
        </h1>

        <p className="registro-subtitle">
          We need a few details before starting your rehabilitation game.
        </p>
      </div>

      <div className="registro-form-section">
        <div className="registro-card">
          <h2 className="registro-card-title">Patient card</h2>

          <form onSubmit={handleSubmit}>
            <div className="registro-form-flex">

              <div className="input-group">
                <label className="input-label">Patient Record Number</label>
                <input
                  type="text"
                  className="registro-input"
                  value={patientFromState?.clinical_patient_id || 'Generated automatically'}
                  disabled
                />
              </div>

              <div className="input-group">
                <label className="input-label">Full name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="registro-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Age</label>
                <input
                  type="number"
                  placeholder="Age"
                  className="registro-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Affected side</label>
                <select
                  className="registro-input"
                  value={affectedSide}
                  onChange={(e) => setAffectedSide(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select affected side</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="both">Both</option>
                  <option value="not_specified">Not specified</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Condition</label>
                <input
                  type="text"
                  placeholder="Example: Stroke rehab, hand injury, prosthetic training"
                  className="registro-input"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="registro-button"
              >
                {loading ? 'Saving...' : 'Save and start calibration'}
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

export default CompletePatientProfile;