
import React, { useEffect, useState } from 'react';
import { generateSessionPDF } from '../src/SessionPdf';
const API_URL = import.meta.env.VITE_APP_API_URL;

const PatientHistoryModal = ({ patient, token, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [date, setDate] = useState('');
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(false);

  const patientId = patient?.id || patient?._id;

  const fetchSessions = async () => {
    if (!patientId) return;

    setLoading(true);

    const params = new URLSearchParams();
   if (date) params.append('date', date);
   console.log("History patient:", patient);
console.log("History patientId:", patientId);
console.log("History date:", date);
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
  const downloadSessionPDF = async (sessionId) => {
  try {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/report-data`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      alert("Could not load session report.");
      return;
    }

    const s = data.session;

    generateSessionPDF({
      patient: {
        id: s.patient_id,
        name: s.name,
        age: s.age,
        affected_side: s.affected_side,
        medical_observation: s.condition
      },
      metrics: {
        si: s.selectivity_index,
        cr: s.coactivation_ratio,
        fatigue: s.fatigue_trend,
        ce: s.control_efficiency
      },
      score: s.score,
      sessionHistory: data.samples,
      gameMode: s.game_mode
    });

  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Error downloading PDF.");
  }
};

  useEffect(() => {
    fetchSessions();
  }, [patientId]);

 return (
  <div className="history-overlay">
    <div className="history-modal">

      <div className="history-header">
        <div>
          <h2 className="history-title">Session History</h2>
          <p className="history-subtitle">
            {patient?.name || 'Patient'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="history-close"
        >
          ✕
        </button>
      </div>

      <div className="history-filters">

        <div className="history-filter-group">
          <label className="history-label">Date</label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="history-input"
          />
        </div>

        <button
          onClick={fetchSessions}
          className="history-filter-button"
        >
          FILTER
        </button>

        <button
          onClick={() => {
            setDate('');
            setTimeout(fetchSessions, 0);
          }}
          className="history-clear-button"
        >
          CLEAR
        </button>

      </div>

      {loading ? (

        <div className="history-empty">
          Loading sessions...
        </div>

      ) : sessions.length === 0 ? (

        <div className="history-empty">
          No sessions found.
        </div>

      ) : (

        <div className="history-table-wrapper">

          <table className="history-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Mode</th>
                <th>Score</th>
                <th>SI</th>
                <th>CR</th>
                <th>Fatigue</th>
                <th>CE</th>
                <th>PDF</th>
              </tr>
            </thead>

            <tbody>

              {sessions.map((s) => (

                <tr key={s.id}>

                  <td>
                    {s.created_at
                      ? new Date(s.created_at).toLocaleString()
                      : 'N/A'}
                  </td>

                  <td>
                    {s.game_mode}
                  </td>

                  <td>
                    {s.score}
                  </td>

                  <td>
                    {Number(s.selectivity_index || 0).toFixed(2)}
                  </td>

                  <td>
                    {Number(s.coactivation_ratio || 0).toFixed(2)}%
                  </td>

                  <td>
                    {Number(s.fatigue_trend || 0).toFixed(2)}%
                  </td>

                  <td>
                    {Number(s.control_efficiency || 0).toFixed(2)}
                  </td>

                  <td>
                    <button
                      onClick={() => downloadSessionPDF(s.id)}
                      className="history-pdf-button"
                    >
                      DOWNLOAD
                    </button>
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


export default PatientHistoryModal;