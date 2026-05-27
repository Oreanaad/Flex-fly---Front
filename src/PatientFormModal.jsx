import React, { useState } from 'react';
import '../src/css/PatientFormModal.css';

const PatientFormModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    affected_side: 'Right Hemiplegia',
    condition: ''
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }

    if (!formData.age || formData.age <= 0 || formData.age > 110) {
      setError('Please enter a valid age.');
      return;
    }

    if (!formData.condition.trim()) {
      setError('Please include a brief medical observation.');
      return;
    }

    setError('');

    onSave({
      ...formData,
      id_number: `PAT-${Date.now()}`
    });
  };

  return (
    <div className="patient-modal-overlay">
      <div className="patient-modal-content">
        <h2 className="patient-modal-title">Patient Data</h2>
        <p className="patient-modal-subtitle">
          Complete the clinical information to start the session.
        </p>

        {error && (
          <div className="patient-modal-error">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="patient-input-group">
            <label className="patient-label">Full Name</label>
            <input
              className="patient-input"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="patient-input-group">
            <label className="patient-label">Age</label>
            <input
              className="patient-input"
              type="number"
              placeholder="00"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>

          <div className="patient-input-group">
            <label className="patient-label">Affected Side</label>
            <select
              className="patient-input patient-select"
              value={formData.affected_side}
              onChange={(e) => setFormData({ ...formData, affected_side: e.target.value })}
            >
              <option value="Right Hemiplegia">Right Hemiplegia</option>
              <option value="Left Hemiplegia">Left Hemiplegia</option>
              <option value="Bilateral">Bilateral / Other</option>
            </select>
          </div>

          <div className="patient-input-group">
            <label className="patient-label">Medical Observations</label>
            <textarea
              className="patient-input patient-textarea"
              placeholder="Patient's condition..."
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            />
          </div>

          <button type="submit" className="patient-submit-button">
            CREATE CLINICAL FILE
          </button>

          <button type="button" onClick={onCancel} className="patient-cancel-button">
            CANCEL AND GO BACK
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;