import React, { useState, useEffect  } from 'react';
import { useWebSerial } from './useWebSerial';
import { AuthProvider } from './Context/AuthContext';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import RegistroPatients from './pages/RegistroPatients';
import BionicLogin from './pages/Login'; 
import Registro from './pages/Registro';
import VerifySuccess from './VerifySuccess';
import DoctorDashboard from './DoctorDashboard';
import Calibration from './Calibration';
import ChickenGame from './Components/ChickenGame/ChickenGame';
import BionicLoginPatients from './pages/LoginPatients';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CompletePatientProfile from './pages/CompletePatientProfile';
import PatientGameIntroModal from './Components/PatientGameIntroModal';
import '../src/App.css'
const CalibrationRoute = ({ isConnected, connectSerial, rawValues, setLimits, setMode }) => {
  const location = useLocation();
  const patient = location.state?.patient || null;
  const patientId = location.state?.patientId || patient?.id || patient?._id || null;

  return (
    <Calibration 
      isConnected={isConnected}
      connectSerial={connectSerial}
      raw_A={rawValues.a} 
      raw_B={rawValues.b}
      patient={patient}
      patientId={patientId}
      onComplete={(l, m) => {
        setLimits(l);
        setMode(m);
      }} 
    />
  );
};

const GameRoute = ({ isConnected, rawValues, limits, mode }) => {
  const location = useLocation();
const [gameStarted, setGameStarted] = useState(false);
const [startCountdown, setStartCountdown] = useState(null);
const [introOpenedFromHelp, setIntroOpenedFromHelp] = useState(false);
  const patient =
    location.state?.patient ||
    JSON.parse(localStorage.getItem('patient') || 'null');

  const patientId =
    location.state?.patientId ||
    patient?.clinical_patient_id ||
    patient?.id ||
    patient?._id ||
    null;

  const [showGameIntro, setShowGameIntro] = useState(false);

  useEffect(() => {
  const userType = localStorage.getItem('userType');
  const alreadySeen = localStorage.getItem('patientGameIntroSeen');

  if (userType === 'patient' && alreadySeen !== 'true') {
    setShowGameIntro(true);
    setGameStarted(false);
    setStartCountdown(null);
  } else {
    setShowGameIntro(false);
    setGameStarted(false);
    setStartCountdown(5);
  }
}, []);

  const handleStartGame = () => {
  localStorage.setItem('patientGameIntroSeen', 'true');
  setShowGameIntro(false);

  if (introOpenedFromHelp) {
    setIntroOpenedFromHelp(false);
    return;
  }

  setStartCountdown(5);
};
const openHowToPlay = () => {
  setIntroOpenedFromHelp(true);
  setShowGameIntro(true);
};
  const effA = Math.min(1.0, rawValues.a / (limits.maxA > 0.01 ? limits.maxA : 1.0));
  const effB = Math.min(1.0, rawValues.b / (limits.maxB > 0.01 ? limits.maxB : 1.0));
useEffect(() => {
  if (startCountdown === null) return;

  if (startCountdown > 0) {
    const timer = setTimeout(() => {
      setStartCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }

  if (startCountdown === 0) {
    setGameStarted(true);
    setStartCountdown(null);
  }
}, [startCountdown]);
  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        No patient selected. Please go back to the dashboard.
      </div>
    );
  }


    return (
  <div className="game-page-shell compact-game-page">
    {showGameIntro && (
      <PatientGameIntroModal onStart={handleStartGame} />
    )}

    {!showGameIntro && (
      <>
        <button
          type="button"
          className="game-help-floating"
          onClick={openHowToPlay}
        >
          How to play?
        </button>

        <div className="game-compact-header">
          <span className="game-phase-badge">Phase 2</span>
          <h1 className="game-page-title">Rehab Training Game</h1>
          <p className="game-page-subtitle">
            Control the chicken, avoid rocks, and collect worms.
          </p>
        </div>

        <div className="game-stage-card compact-stage-card">
          {startCountdown !== null && (
            <div className="game-countdown-screen">
              <p className="game-countdown-label">Get ready</p>
              <h2 className="game-countdown-number">
                {startCountdown}
              </h2>
              <p className="game-countdown-text">
                The game will start in a few seconds
              </p>
            </div>
          )}

          {gameStarted && (
            <>
              {isConnected && (
                <div className="game-telemetry-pills">
                  <span>EMG Telemetry</span>
                  <strong>{`A: ${(effA * 100).toFixed(0)}%`}</strong>
                  <strong>{`B: ${(effB * 100).toFixed(0)}%`}</strong>
                  <strong>{mode}</strong>
                </div>
              )}

              <ChickenGame 
                eff_A={rawValues.a} 
                eff_B={rawValues.b}
                gameMode={mode}
                patientId={patientId}
                patient={patient}
                maxA={limits.maxA}
                maxB={limits.maxB}
                onShowHelp={openHowToPlay}
              />
            </>
          )}
        </div>
      </>
    )}
  </div>
);
};

const App = () => {
  const { rawValues, isConnected, connectSerial } = useWebSerial();

  const [mode, setMode] = useState('COMBINED');
  const [limits, setLimits] = useState({ maxA: 1.0, maxB: 1.0 });

  return (
    <div className="min-h-screen bg-slate-950">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<BionicLogin />} /> 
            <Route path="/login" element={<BionicLogin />} /> 
            <Route path="/registro" element={<Registro />} />
            <Route path="/verify-success" element={<VerifySuccess />} />
            <Route path="/dashboard" element={<DoctorDashboard />} />
            <Route path='/loginPatients' element={<BionicLoginPatients/>}/>
            <Route path="/forgot-password/:userType" element={<ForgotPassword />} />
            <Route path="/reset-password/:userType/:token" element={<ResetPassword />} />
            <Route path='/RegistroPatients' element={<RegistroPatients/>}/>
            <Route path="/complete-patient-profile" element={<CompletePatientProfile />} />
            <Route path="/patient-calibration" element={
            <CalibrationRoute
              isConnected={isConnected}
              connectSerial={connectSerial}
              rawValues={rawValues}
              setLimits={setLimits}
              setMode={setMode}
            />
          } />
            <Route path="/calibration" element={
              <CalibrationRoute
                isConnected={isConnected}
                connectSerial={connectSerial}
                rawValues={rawValues}
                setLimits={setLimits}
                setMode={setMode}
              />
            } />

            <Route path="/game" element={
              <GameRoute
                isConnected={isConnected}
                rawValues={rawValues}
                limits={limits}
                mode={mode}
              />
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
};

export default App;