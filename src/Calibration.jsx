import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calibration.css';
import PatientOnboardingModal from '../src/Components/PatientOnboardingModal';

const Calibration = ({ isConnected, connectSerial, raw_A, raw_B, onComplete, patient, patientId })=> {
  
   const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('COMBINED');
const [isCalibrating, setIsCalibrating] = useState(false);
const [timeLeft, setTimeLeft] = useState(0);

// IDLE | COUNTDOWN | SAMPLING | REST
const [calibrationStage, setCalibrationStage] = useState('IDLE');

// A | B
const [phase, setPhase] = useState('IDLE');

// 1, 2, 3
const [sampleRound, setSampleRound] = useState(1);

// max value inside the current 10-second sample
const [currentSampleMax, setCurrentSampleMax] = useState({ a: 0, b: 0 });

// all sample max values
const [sampleResults, setSampleResults] = useState({
  a: [],
  b: []
});

// final values shown on screen
const [tempMax, setTempMax] = useState({ a: 0, b: 0 });
  const timerRef = useRef(null);
  const emgCanvasARef = useRef(null);
  const emgCanvasBRef = useRef(null);
  const emgHistoryA = useRef(Array(120).fill(0));
  const emgHistoryB = useRef(Array(120).fill(0));

    useEffect(() => {
    const userType = localStorage.getItem('userType');
    const alreadySeen = localStorage.getItem('patientCalibrationIntroSeen');

    if (userType === 'patient' && alreadySeen !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('patientCalibrationIntroSeen', 'true');
    setShowOnboarding(false);
  };
  const displayRawA = `${(Number(raw_A || 0) * 100).toFixed(0)}%`;
  const displayRawB = `${(Number(raw_B || 0) * 100).toFixed(0)}%`;
const drawEMG = (canvas, history, color, isActive = true) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const midY = height / 2;



  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = isActive ? color : '#334155';
  ctx.lineWidth = isActive ? 2 : 1;
  ctx.shadowBlur = isActive ? 8 : 0;
  ctx.shadowColor = color;

  ctx.beginPath();

  history.forEach((value, index) => {
    const x = (index / (history.length - 1)) * width;
    const y = midY - (value * 42);

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
  ctx.shadowBlur = 0;

  if (!isActive) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INACTIVE', width / 2, midY + 4);
  }
};

useEffect(() => {
  const rawValueA = Math.min(Number(raw_A || 0), 1);
  const rawValueB = Math.min(Number(raw_B || 0), 1);

  const lastA = emgHistoryA.current[emgHistoryA.current.length - 1] || 0;
  const lastB = emgHistoryB.current[emgHistoryB.current.length - 1] || 0;

  const smoothA = (lastA * 0.75) + (rawValueA * 0.25);
  const smoothB = (lastB * 0.75) + (rawValueB * 0.25);

  const isChannelAActive = phase !== 'B';
  const isChannelBActive = phase !== 'A';
  
  emgHistoryA.current = [
    ...emgHistoryA.current.slice(1),
    isChannelAActive ? smoothA : 0
  ];

  emgHistoryB.current = [
    ...emgHistoryB.current.slice(1),
    isChannelBActive ? smoothB : 0
  ];

  drawEMG(emgCanvasARef.current, emgHistoryA.current, '#10b981', isChannelAActive);
  drawEMG(emgCanvasBRef.current, emgHistoryB.current, '#f59e0b', isChannelBActive);
}, [raw_A, raw_B, phase]);

  useEffect(() => {
  if (!isCalibrating) return;
  if (calibrationStage !== 'SAMPLING') return;

  if (phase === 'A') {
    const valueA = Number(raw_A || 0);

    setCurrentSampleMax(prev => ({
      ...prev,
      a: Math.max(prev.a, valueA)
    }));
  }

  if (phase === 'B') {
    const valueB = Number(raw_B || 0);

    setCurrentSampleMax(prev => ({
      ...prev,
      b: Math.max(prev.b, valueB)
    }));
  }
}, [raw_A, raw_B, isCalibrating, calibrationStage, phase]);
 
useEffect(() => {
  if (!isCalibrating) return;

  if (timeLeft > 0) {
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }

  if (timeLeft !== 0) return;

  if (calibrationStage === 'COUNTDOWN') {
    setCurrentSampleMax({ a: 0, b: 0 });
    setCalibrationStage('SAMPLING');
    setTimeLeft(10);
    return;
  }

  if (calibrationStage === 'SAMPLING') {
    const channelKey = phase.toLowerCase();

    const valueToSave =
      phase === 'A'
        ? currentSampleMax.a
        : currentSampleMax.b;

    const updatedResults = {
      ...sampleResults,
      [channelKey]: [
        ...sampleResults[channelKey],
        valueToSave
      ]
    };

    setSampleResults(updatedResults);

    const channelAverage = calculateAverageMax(updatedResults[channelKey]);

    setTempMax(prev => ({
      ...prev,
      [channelKey]: channelAverage
    }));

    if (sampleRound < 3) {
      setCalibrationStage('REST');
      setTimeLeft(4);
      return;
    }

    if (shouldContinueToChannelB(phase)) {
      setPhase('B');

      // Important: set to 0 so REST will move it to sample 1
      setSampleRound(0);

      setCalibrationStage('REST');
      setTimeLeft(5);
      return;
    }

    finishCalibration(updatedResults);
    return;
  }

  if (calibrationStage === 'REST') {
    setSampleRound(prev => {
      if (prev === 0) return 1;
      if (prev < 3) return prev + 1;
      return prev;
    });

    setCalibrationStage('COUNTDOWN');
    setTimeLeft(3);
  }

}, [
  isCalibrating,
  timeLeft,
  calibrationStage,
  phase,
  sampleRound
]);
  
  const getFirstPhase = () => {
  if (activeMode === 'EXTENSION') return 'B';
  return 'A';
};

const shouldContinueToChannelB = (finishedPhase) => {
  return activeMode === 'COMBINED' && finishedPhase === 'A';
};

const calculateAverageMax = (values) => {
  if (!values || values.length === 0) return 0.01;

  const sum = values.reduce((acc, value) => acc + value, 0);
  const average = sum / values.length;

  return average > 0.02 ? average : 0.01;
};

const finishCalibration = (finalResults) => {
  const finalMaxA =
    activeMode === 'EXTENSION'
      ? 0.01
      : calculateAverageMax(finalResults.a);

  const finalMaxB =
    activeMode === 'FLEXION'
      ? 0.01
      : calculateAverageMax(finalResults.b);

  setIsCalibrating(false);
  setCalibrationStage('IDLE');
  setPhase('IDLE');
  setTimeLeft(0);

  setTempMax({
    a: finalMaxA,
    b: finalMaxB
  });

  onComplete({ maxA: finalMaxA, maxB: finalMaxB }, activeMode);

  setTimeout(() => navigate('/game', {
    state: {
      patient,
      patientId,
      limits: { maxA: finalMaxA, maxB: finalMaxB },
      mode: activeMode
    }
  }), 800);
};

 const handleStartCalibration = () => {
  if (!isConnected) {
    return alert("Please connect your bionic hand first.");
  }

  const firstPhase = getFirstPhase();

  setTempMax({ a: 0, b: 0 });
  setCurrentSampleMax({ a: 0, b: 0 });
  setSampleResults({ a: [], b: [] });
  setSampleRound(1);

  setPhase(firstPhase);
  setCalibrationStage('COUNTDOWN');
  setTimeLeft(3);
  setIsCalibrating(true);
};

  return (
    <>
    {showOnboarding && (
    <PatientOnboardingModal onFinish={handleFinishOnboarding} />
  )}


    <div className="calibration-container">
      <header className="calibration-header">
      <h1 className="calibration-title">Set up your bionic hand</h1>
      <p className="calibration-subtitle">
        We’ll guide you step by step before starting your rehab game.
      </p>
</header>
<div className="help-button-wrapper">
  <button
    type="button"
    className="help-button"
    onClick={() => setShowOnboarding(true)}
  >
    How to calibrate?
  </button>
</div>

     <div className="patient-step-card">
  <span className="step-label">Step 1</span>
  <h2 className="step-title">Connect your bionic hand</h2>
  <p className="step-description">
    Click the button below and select your device from the browser window. 
    Make sure your bionic hand is turned on and connected to your computer.
  </p>

  {!isConnected ? (
    <button className="connect-btn" onClick={connectSerial}>
      🔌 Click here to connect your hand
    </button>
  ) : (
    <div className="connected-badge">
      ✅ Your bionic hand is connected
    </div>
  )}
</div>
    <div className="patient-step-card">
  <span className="step-label">Step 2</span>
  <h2 className="step-title">Choose your training mode for today</h2>
  <p className="step-description">
    Select the type of movement you want to practice. If you are not sure, 
    choose Combined Mode for a complete training session.
  </p>
</div>

     <div className="mode-grid">
  {[
    {
      key: 'FLEXION',
      icon: '💪',
      title: 'Flexion Mode',
      subtitle: 'Practice closing or pulling movement',
      description: 'Use this mode to train Channel A. It is useful when you want to focus on one specific muscle activation.'
    },
    {
      key: 'EXTENSION',
      icon: '🤚',
      title: 'Extension Mode',
      subtitle: 'Practice opening or pushing movement',
      description: 'Use this mode to train Channel B. It helps you improve control of the opposite movement.'
    },
    {
      key: 'COMBINED',
      icon: '⚙️',
      title: 'Combined Mode',
      subtitle: 'Train both movements together',
      description: 'Recommended for most sessions. You will calibrate both channels and then play using both muscle signals.'
    }
  ].map(mode => (
    <div
      key={mode.key}
      onClick={() => !isCalibrating && setActiveMode(mode.key)}
      className={`mode-card ${activeMode === mode.key ? 'active-card' : ''}`}
    >
      <div className="mode-icon">{mode.icon}</div>

      <h3>{mode.title}</h3>

      <p className="mode-description">
        {mode.subtitle}
      </p>

      <p className="mode-help-text">
        {mode.description}
      </p>

      {activeMode === mode.key && (
        <div className="selected-mode-badge">
          Selected
        </div>
      )}
    </div>
  ))}
</div>
 <div className="patient-step-card">
  <span className="step-label">Step 3</span>
  <h2 className="step-title">Start calibration</h2>
  <p className="step-description">
    When you press start, follow the instruction on screen. Try to perform the movement gradually and safely.
  </p>
</div>
      <div className="stats-row">
        <div className={`stat-box ${phase === 'B' ? 'inactive-phase' : ''}`}>
          <span className="stat-label">Raw Channel A</span>
          <p className="stat-value">{displayRawA}</p>

          <canvas
            ref={emgCanvasARef}
            width={180}
            height={70}
            className="emg-canvas"
          />

          <span className="max-value">MAX: {(tempMax.a * 100).toFixed(0)}%</span>
        </div>

        <div className={`stat-box ${phase === 'A' ? 'inactive-phase' : ''}`}>
          <span className="stat-label">Raw Channel B</span>
          <p className="stat-value">{displayRawB}</p>

          <canvas
            ref={emgCanvasBRef}
            width={180}
            height={70}
            className="emg-canvas"
          />

          <span className="max-value">MAX: {(tempMax.b * 100).toFixed(0)}%</span>
        </div>
      </div>
   

      {isCalibrating ? (
  <div className="calibrating-box">

    {calibrationStage === 'COUNTDOWN' && (
      <>
        <p className="calibrating-instruction">
          Get ready for sample {sampleRound} of 3
        </p>

        <p className="calibrating-helper">
          {phase === 'A'
            ? "Prepare to gently close or flex your hand."
            : "Prepare to gently open or extend your hand."}
        </p>

        <div className="timer">{timeLeft}s</div>
      </>
    )}

    {calibrationStage === 'SAMPLING' && (
      <>
        <p className="calibrating-instruction">
          {phase === 'A'
            ? "Now gently close or flex your hand"
            : "Now gently open or extend your hand"}
        </p>

        <p className="calibrating-helper">
          Sample {sampleRound} of 3 — keep the movement controlled until the timer finishes.
        </p>

        <div className="timer">{timeLeft}s</div>
      </>
    )}

    {calibrationStage === 'REST' && (
      <>
        <p className="calibrating-instruction">
          Relax your muscle
        </p>

        <p className="calibrating-helper">
          Great job. Rest for a few seconds, then we will try again.
        </p>

        <div className="timer">{timeLeft}s</div>
      </>
    )}

  </div>
) : (
  <button
    className={`action-btn ${!isConnected ? 'disabled-btn' : ''}`}
    onClick={handleStartCalibration}
    disabled={!isConnected}
  >
    {activeMode === 'COMBINED' 
      ? "Start calibration for both movements" 
      : "Start calibration for this movement"}
  </button>
)}
<p className="registro-subtitle">
          Bionic Rehabilitation Software of Kawatek.
        </p>
    </div>
     </>
  );
};

export default Calibration;