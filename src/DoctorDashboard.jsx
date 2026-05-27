import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './Context/AuthContext';
import PatientFormModal from './PatientFormModal';
import PatientViewModal from './PatientViewModal';
import PatientHistoryModal from './PatientHistoryModal';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [historyPatient, setHistoryPatient] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState('all');

  const API_URL = import.meta.env.VITE_APP_API_URL;

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const handleViewHistory = (patient) => {
    setHistoryPatient(patient);
    setIsHistoryModalOpen(true);
  };

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        const endpoint =
          viewMode === 'mine'
            ? `${API_URL}/api/doctors/${user.id}/my-patients`
            : `${API_URL}/api/patients/all/${user.id}`;

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        } else {
          console.error('Error response loading patients:', response.status);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user, token, API_URL, viewMode]);

  const handleSavePatient = async (patientData) => {
    try {
      const response = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...patientData, doctor_id: user.id })
      });

      const result = await response.json();

      if (result.success) {
        setPatients([result.patient, ...patients]);
        setIsModalOpen(false);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error connecting to the server.');
    }
  };

  const handleAssignPatient = async (patientId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/doctors/${user.id}/assign-patient/${patientId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const result = await response.json();

      if (result.success) {
        setPatients((prev) =>
          prev.map((p) =>
            (p.id || p._id) === patientId
              ? { ...p, assigned_to_me: true }
              : p
          )
        );
      } else {
        alert(result.message || 'Could not assign patient.');
      }
    } catch (error) {
      alert('Connection error while assigning patient.');
    }
  };

  const handleRemoveFromMyPatients = async (patientId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/doctors/${user.id}/remove-patient/${patientId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const result = await response.json();

      if (result.success) {
        setPatients((prev) => prev.filter((p) => (p.id || p._id) !== patientId));
      } else {
        alert(result.message || 'Could not remove patient.');
      }
    } catch (error) {
      alert('Connection error while removing patient.');
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="logo-container">
          <h1 className="logo-text">KAWATEK</h1>
          <p className="logo-subtext">Bionic Rehab System</p>
        </div>

        <nav>
          <div
            className={`nav-link ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            🌎 &nbsp; All Patients
          </div>

          <div
            className={`nav-link ${viewMode === 'mine' ? 'active' : ''}`}
            onClick={() => setViewMode('mine')}
          >
            👥 &nbsp; My Patients
          </div>

   
        </nav>

        <div className="doctor-name">
          Dr. {user?.username || 'User'}
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h2 className="dashboard-title">
              {viewMode === 'mine' ? 'My Patients' : 'All Patients'}
            </h2>

            <p className="dashboard-subtitle">
              {viewMode === 'mine'
                ? 'Patients currently assigned to you.'
                : 'All patients registered in the Kawatek platform.'}
            </p>
          </div>

          {patients.length > 0 && (
            <button className="primary-button" onClick={() => setIsModalOpen(true)}>
              + REGISTER PATIENT
            </button>
          )}
        </header>

        {loading ? (
          <div className="loading-text">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="central-card">
            <div className="icon-circle">👥</div>

            <h3 className="empty-title">
              {viewMode === 'mine'
                ? 'No patients assigned to you yet'
                : 'No registered patients yet'}
            </h3>

            <p className="empty-text">
              {viewMode === 'mine'
                ? 'Go to All Patients and assign patients to your list.'
                : 'To start EMG training, you must first register a patient.'}
            </p>

            <button className="primary-button center-button" onClick={() => setIsModalOpen(true)}>
              + REGISTER PATIENT
            </button>
          </div>
        ) : (
          <div className="patient-grid">
            {patients.map((p) => {
              const pId = p.id || p._id;

              return (
                <div key={pId} className="patient-card">
                  {viewMode === 'mine' && (
                    <button
                      className="delete-button"
                      onClick={() => handleRemoveFromMyPatients(pId)}
                    >
                      ✕
                    </button>
                  )}

                  <h4 className="patient-name">{p.name}</h4>
                  <p className="patient-condition">{p.condition || 'No condition specified'}</p>

                  <div className="card-actions">
                    <button
                      onClick={() => handleViewPatient(p)}
                      className="view-button info-button"

                    >
                      INFO
                    </button>

                    <button
                      onClick={() => handleViewHistory(p)}
                      className="view-button history-button"

                    >
                      HISTORY
                    </button>

                    {viewMode === 'mine' && (
                      <button
                        onClick={() =>
                          navigate('/calibration', {
                            state: {
                              patient: p,
                              patientId: pId
                            }
                          })
                        }
                        className="primary-button full-width"
                      >
                        START SESSION
                      </button>
                    )}

                  {viewMode === 'all' && (
  p.assigned_to_me ? (
    <div className="assignment-status assigned-me full-width">
      ASSIGNED TO ME
    </div>
  ) : p.assigned_to_other ? (
    <div className="assignment-status assigned-other full-width">
      ASSIGNED TO {p.assigned_doctor_name || 'ANOTHER DOCTOR'}
    </div>
  ) : (
    <button
      onClick={() => handleAssignPatient(pId)}
      className="primary-button assign-button full-width"
    >
      ASSIGN TO ME
    </button>
  )
)}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isModalOpen && (
        <PatientFormModal
          onSave={handleSavePatient}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {isViewModalOpen && (
        <PatientViewModal
          patient={selectedPatient}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}

      {isHistoryModalOpen && (
        <PatientHistoryModal
          patient={historyPatient}
          token={token}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;