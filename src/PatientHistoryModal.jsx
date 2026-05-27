
import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_APP_API_URL;

const PatientHistoryModal = ({ patient, token, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(false);

  const patientId = patient?.id || patient?._id;

  const fetchSessions = async () => {
    if (!patientId) return;

    setLoading(true);

    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (mode) params.append('mode', mode);

    try {
      const response = await fetch(
        `${API_URL}/api/patients/${patientId}/sessions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading session history:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [patientId]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Session History</h2>
            <p style={styles.subtitle}>{patient?.name || 'Patient'}</p>
          </div>

          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.filters}>
          <div>
            <label style={styles.label}>From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={styles.input}
            >
              <option value="">All</option>
              <option value="FLEXION">FLEXION</option>
              <option value="EXTENSION">EXTENSION</option>
              <option value="COMBINED">COMBINED</option>
            </select>
          </div>

          <button onClick={fetchSessions} style={styles.filterButton}>
            Filter
          </button>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p style={styles.empty}>No sessions found.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Mode</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>SI</th>
                  <th style={styles.th}>CR</th>
                  <th style={styles.th}>Fatigue</th>
                  <th style={styles.th}>CE</th>
                  <th style={styles.th}>PDF</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={styles.td}>
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td style={styles.td}>{s.game_mode}</td>
                    <td style={styles.td}>{s.score}</td>
                    <td style={styles.td}>{s.selectivity_index}</td>
                    <td style={styles.td}>{s.coactivation_ratio}%</td>
                    <td style={styles.td}>{s.fatigue_trend}%</td>
                    <td style={styles.td}>{s.control_efficiency}</td>
                    <td style={styles.td}>
                      {s.pdf_url ? (
                        <a href={s.pdf_url} target="_blank" rel="noreferrer">
                          Download
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No PDF</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxWidth: '1050px',
    maxHeight: '85vh',
    overflowY: 'auto',
    borderRadius: '18px',
    padding: '28px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#0f172a'
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#64748b'
  },
  closeButton: {
    border: 'none',
    background: '#f1f5f9',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  filters: {
    display: 'flex',
    gap: '14px',
    alignItems: 'end',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '6px',
    fontWeight: 600
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    minWidth: '150px'
  },
  filterButton: {
    backgroundColor: '#6d28d9',
    color: 'white',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    padding: '40px 0'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '13px'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '13px',
    color: '#334155'
  }
};

export default PatientHistoryModal;