import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './Context/AuthContext';
import PatientFormModal from './PatientFormModal';
import PatientViewModal from './PatientViewModal';

const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: '#f4f6f8',
    color: '#1a1a1a',
  },
  viewButton: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '10px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1, 
    textAlign: 'center',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#0f172a',
    color: 'white',
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #1e293b',
  },
  logoContainer: { textAlign: 'center', marginBottom: '40px' },
  logoText: { fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px', margin: 0 },
  logoSubtext: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    textDecoration: 'none',
    color: '#cbd5e1',
    borderRadius: '8px',
    marginBottom: '10px',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  navLinkActive: { backgroundColor: '#1e293b', color: 'white', fontWeight: '600' },
  mainContent: { flex: 1, padding: '40px 60px' },
  header: { display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  headerTitle: { fontSize: '28px', fontWeight: '700', margin: 0, color: '#0f172a' },
  headerSubtitle: { fontSize: '15px', color: '#64748b', marginTop: '5px' },
  centralCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '60px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto',
  },
  patientGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    position: 'relative', 
  },
  deleteButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: 'none',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '5px',
    lineHeight: '1',
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    backgroundColor: '#f1f5f9',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto 30px auto',
    color: '#64748b',
  },
  primaryButton: {
    backgroundColor: '#6d28d9',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
};

const DoctorDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // all | mine
  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };
  
  const API_URL = import.meta.env.VITE_APP_API_URL;

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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        console.error("Error response loading patients:", response.status);
      }
    } catch (error) {
      console.error("Error loading patients:", error);
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
          'Authorization': `Bearer ${token}`
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
      alert("Error connecting to the server.");
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${patientName}?`);
    
    if (confirmed) {
      try {
        const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          setPatients(patients.filter(p => (p.id !== patientId && p._id !== patientId)));
        } else {
          alert("Could not delete patient.");
        }
      } catch (error) {
        alert("Connection error while attempting to delete.");
      }
    }
  };
const handleAssignPatient = async (patientId) => {
  try {
    const response = await fetch(`${API_URL}/api/doctors/${user.id}/assign-patient/${patientId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (result.success) {
      setPatients(prev =>
        prev.map(p =>
          (p.id || p._id) === patientId
            ? { ...p, assigned_to_me: true }
            : p
        )
      );
    } else {
      alert(result.message || "Could not assign patient.");
    }
  } catch (error) {
    alert("Connection error while assigning patient.");
  }
};

const handleRemoveFromMyPatients = async (patientId) => {
  try {
    const response = await fetch(`${API_URL}/api/doctors/${user.id}/remove-patient/${patientId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    if (result.success) {
      setPatients(prev => prev.filter(p => (p.id || p._id) !== patientId));
    } else {
      alert(result.message || "Could not remove patient.");
    }
  } catch (error) {
    alert("Connection error while removing patient.");
  }
};
  return (
    <div style={styles.dashboardContainer}>
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <h1 style={styles.logoText}>KAWATEK</h1>
          <p style={styles.logoSubtext}>Bionic Rehab System</p>
        </div>
        <nav>
             <div
          style={{
            ...styles.navLink,
            ...(viewMode === 'all' ? styles.navLinkActive : {})
          }}
          onClick={() => setViewMode('all')}
        >
          🌎 &nbsp; All Patients
        </div>

        <div
          style={{
            ...styles.navLink,
            ...(viewMode === 'mine' ? styles.navLinkActive : {})
          }}
          onClick={() => setViewMode('mine')}
        >
          👥 &nbsp; My Patients
        </div>
        <div style={styles.navLink}>📊 &nbsp; Session History</div>
       
 </nav>
         <div style={{marginTop: 'auto', fontSize: '13px', color: '#94a3b8', textAlign: 'center'}}>
          Dr. {user?.username || 'User'}
        </div>
      </aside>

      <main style={styles.mainContent}>

        <header style={styles.header}>
          <div>
         <h2 style={styles.headerTitle}>
  {viewMode === 'mine' ? 'My Patients' : 'All Patients'}
</h2>

<p style={styles.headerSubtitle}>
  {viewMode === 'mine'
    ? 'Patients currently assigned to you.'
    : 'All patients registered in the Kawatek platform.'}
</p> </div>
          {patients.length > 0 && (
            <button style={styles.primaryButton} onClick={() => setIsModalOpen(true)}>
              + REGISTER PATIENT
            </button>
          )}
        </header>

        {loading ? (
          <div style={{textAlign: 'center', marginTop: '100px'}}>Loading patients...</div>
        ) : patients.length === 0 ? (
          <div style={styles.centralCard}>
            <div style={styles.iconCircle}>👥</div>
            <h3 style={{fontSize: '24px', fontWeight: '600', marginBottom: '15px'}}>
  {viewMode === 'mine' ? 'No patients assigned to you yet' : 'No registered patients yet'}
</h3>

<p style={{color: '#64748b', marginBottom: '40px'}}>
  {viewMode === 'mine'
    ? 'Go to All Patients and assign patients to your list.'
    : 'To start EMG training, you must first register a patient.'}
</p>  <button style={{...styles.primaryButton, margin: '0 auto'}} onClick={() => setIsModalOpen(true)}>
              <span>+</span> REGISTER PATIENT
            </button>
          </div>
        ) : (
          <div style={styles.patientGrid}>
            {patients.map(p => {
              const pId = p.id || p._id; 
              return (
                <div key={pId} style={styles.patientCard}>
                  {viewMode === 'mine' && (
  <button 
    style={styles.deleteButton} 
    onClick={() => handleRemoveFromMyPatients(pId)}
  >
    ✕
  </button>
)}

                  <h4 style={{margin: '0 0 10px 0', fontSize: '18px'}}>{p.name}</h4>
                  <p style={{fontSize: '13px', color: '#64748b', marginBottom: '20px'}}>{p.condition}</p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleViewPatient(p)}
                      style={styles.viewButton}
                    >
                      INFO
                    </button>
                    <button 
                onClick={() => navigate('/calibration', { 
                  state: { 
                    patient: p,
                    patientId: pId 
                  } 
                })}
                style={{...styles.primaryButton, flex: 2, justifyContent: 'center', padding: '10px'}}
              >
                START
              </button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
  {viewMode === 'all' && (
    p.assigned_to_me ? (
      <button
        disabled
        style={{
          ...styles.viewButton,
          cursor: 'default',
          opacity: 0.7
        }}
      >
        ASSIGNED TO ME
      </button>
    ) : (
      <button
        onClick={() => handleAssignPatient(pId)}
        style={styles.viewButton}
      >
        ASSIGN TO ME
      </button>
    )
  )}

  {viewMode === 'mine' && (
    <button
      onClick={() => handleRemoveFromMyPatients(pId)}
      style={{
        ...styles.viewButton,
        color: '#ef4444'
      }}
    >
      REMOVE FROM MY PATIENTS
    </button>
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
    </div>
  );
};

export default DoctorDashboard;