import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calibration.css';

const Calibration = ({ isConnected, connectSerial, raw_A, raw_B, onComplete }) => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('COMBINED');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState('IDLE');
  const [tempMax, setTempMax] = useState({ a: 0, b: 0 });
  const timerRef = useRef(null);

  const emgCanvasARef = useRef(null);
  const emgCanvasBRef = useRef(null);
  const emgHistoryA = useRef(Array(120).fill(0));
  const emgHistoryB = useRef(Array(120).fill(0));

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
    if (isCalibrating) {
      if (phase === 'A' || activeMode === 'FLEXION') {
        setTempMax(prev => ({ ...prev, a: Math.max(prev.a, raw_A) }));
      }
      if (phase === 'B' || activeMode === 'EXTENSION') {
        setTempMax(prev => ({ ...prev, b: Math.max(prev.b, raw_B) }));
      }
    }
  }, [raw_A, raw_B, isCalibrating, phase, activeMode]);

  useEffect(() => {
    if (!isCalibrating) return;

    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

    if (timeLeft === 0) {
      if (activeMode === 'COMBINED' && phase === 'A') {
        setPhase('B');
        setTimeLeft(5);
      } else {
        setIsCalibrating(false);
        setPhase('IDLE');

        const finalMaxA = tempMax.a > 0.02 ? tempMax.a : 0.01;
        const finalMaxB = tempMax.b > 0.02 ? tempMax.b : 0.01;

        onComplete({ maxA: finalMaxA, maxB: finalMaxB }, activeMode);
        setTimeout(() => navigate('/game'), 800);
      }
    }
  }, [isCalibrating, timeLeft, phase, activeMode]);

  const handleStartCalibration = () => {
    if (!isConnected) return alert("Please connect the Arduino first.");

    setTempMax({ a: 0, b: 0 });

    setIsCalibrating(true);
    setTimeLeft(5);
    setPhase((activeMode === 'COMBINED' || activeMode === 'FLEXION') ? 'A' : 'B');
  };

  return (
    <div className="calibration-container">
      <header className="calibration-header">
        <h1 className="calibration-title">Bio-Sensor Configuration</h1>
        <p className="calibration-subtitle">Calibrate EMG intensity for KAWATEK Protocol.</p>
      </header>

      {!isConnected ? (
        <button className="connect-btn" onClick={connectSerial}>🔌 CONNECT ARDUINO</button>
      ) : (
        <div className="connected-badge">SISTEMA KAWATEK CONECTADO</div>
      )}

      <div className="mode-grid">
        {['FLEXION', 'EXTENSION', 'COMBINED'].map(mode => (
          <div
            key={mode}
            onClick={() => !isCalibrating && setActiveMode(mode)}
            className={`mode-card ${activeMode === mode ? 'active-card' : ''}`}
          >
            <div className="mode-icon">
              {mode === 'FLEXION' ? '💪' : mode === 'EXTENSION' ? '🤚' : '⚙️'}
            </div>
            <h3>{mode}</h3>
            <p className="mode-description">
              {mode === 'COMBINED' ? 'SEQUENTIAL A/B' : `CHANNEL ${mode === 'FLEXION' ? 'A' : 'B'} ONLY`}
            </p>
          </div>
        ))}
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
          <p className="calibrating-instruction">
            {phase === 'A' ? "PULL / FLEX (CHANNEL A)" : "PUSH / EXTEND (CHANNEL B)"}
          </p>
          <div className="timer">{timeLeft}s</div>
        </div>
      ) : (
        <button
          className={`action-btn ${!isConnected ? 'disabled-btn' : ''}`}
          onClick={handleStartCalibration}
          disabled={!isConnected}
        >
          {activeMode === 'COMBINED' ? "START FULL CALIBRATION (10s)" : "START 5s CALIBRATION"}
        </button>
      )}
    </div>
  );
};

export default Calibration;