import React, { useState } from 'react';
import { useWebSerial } from './useWebSerial';
import { AuthProvider } from './Context/AuthContext';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import BionicLogin from './pages/Login'; 
import Registro from './pages/Registro';
import VerifySuccess from './VerifySuccess';
import DoctorDashboard from './DoctorDashboard';
import Calibration from './Calibration';
import ChickenGame from './Components/ChickenGame/ChickenGame';

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
  const patient = location.state?.patient || null;
  const patientId = location.state?.patientId || patient?.id || patient?._id || null;

  const effA = Math.min(1.0, rawValues.a / (limits.maxA > 0.01 ? limits.maxA : 1.0));
  const effB = Math.min(1.0, rawValues.b / (limits.maxB > 0.01 ? limits.maxB : 1.0));

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        No patient selected. Please go back to the dashboard.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative">
      {isConnected && (
        <div className="fixed top-4 left-4 text-emerald-400 font-mono text-xs bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl z-50">
          <span className="block mb-1 text-slate-500 uppercase text-[10px]">EMG Telemetry</span>
          <div className="flex flex-col gap-1">
            <span>{`EFF_A: ${(effA * 100).toFixed(0)}%`}</span>
            <span>{`EFF_B: ${(effB * 100).toFixed(0)}%`}</span>
            <span className="text-amber-400 mt-1 border-t border-slate-700 pt-1">
              {`MODO: ${mode}`}
            </span>
          </div>
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
      />
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