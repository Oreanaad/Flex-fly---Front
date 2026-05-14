import React, { useRef, useEffect, useState } from 'react';
import { calculateClinicalMetrics } from './clinicalMetrics';
import { drawGame } from './gameVisuals';
import { checkCollision, calculateMovement } from './gameEngine';
import '../../css/ChickenGame.css';
import { calculateAdaptiveDifficulty } from './adaptiveEngine';
import {generateSessionPDF} from '../../SessionPdf'

const normalizeEMG = (value, calibratedMax) => {
  const raw = Number(value) || 0;
  const max = Number(calibratedMax) || 0;

  if (raw < 0.02) return 0; // 🔥 FILTRO DE RUIDO

  if (max <= 0) {
    return Math.min(100, raw * 100);
  }

  return Math.min(100, (raw / max) * 100);
};

const ChickenGame = ({ eff_A, eff_B, gameMode, patientId, maxA, maxB,patient }) => {
  const canvasRef = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [startTime, setStartTime] = useState(Date.now());
  const effARef = useRef(0);
  const effBRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const SESSION_DURATION_MS = 4 * 60 * 1000;

  const gameState = useRef({
    chickenX: 400,
    worms: [],
    rocks: [],
    frame: 0,
    showFatigue: false,
    fatiguedChannel: null
  });

  const sessionHistory = useRef([]);
  const rocksHit = useRef(0);
  const lastFeedbackTime = useRef(Date.now());
  const accumulator = useRef({ a: 0, b: 0, count: 0 });
  const lastSaveTime = useRef(Date.now());
  const SAMPLE_WINDOW_MS = 5000;
  const FEEDBACK_WINDOW_MS = 1000;


  const difficultyRef = useRef({
    speedMultiplier: 1,
    wormSpawnRate: 0.02,
    rockSpawnRate: 0.002,
    feedbackMessage: null
  });

  const lastDifficultyUpdate = useRef(Date.now());

  const adaptiveWindow = useRef({
    scoreStart: 0,
    rocksStart: 0,
    lowActivityCount: 0,
    fatigueCount: 0
  });

  // sincroniza señales
  useEffect(() => {
    effARef.current = eff_A;
    effBRef.current = eff_B;
  }, [eff_A, eff_B]);

  // sincroniza score y vidas
  useEffect(() => {
    scoreRef.current = score;
    livesRef.current = lives;
  }, [score, lives]);

  // guardado de sesión
  useEffect(() => {
    if (gameOver && sessionHistory.current.length > 0) {
      if (!patientId) return console.error("⚠️ Error: patientId requerido.");

      const metrics = calculateClinicalMetrics(sessionHistory.current, score, rocksHit.current, startTime);

      const saveData = async () => {
        const API_URL = import.meta.env.VITE_APP_API_URL || 'https://flex-fly-back.onrender.com';

        const formattedSamples = sessionHistory.current.map(s => ({
          t: s.t || s.timestamp || new Date().toISOString(),
          a: s.a !== undefined ? s.a : (s.valA || s.emgA || 0),
          b: s.b !== undefined ? s.b : (s.valB || s.emgB || 0)
        }));

        try {
          await fetch(`${API_URL}/api/save-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: patientId,
              mode: gameMode,
              score,
              samples: formattedSamples,
              metrics: {
                si: metrics.si || 0,
                cr: metrics.cr || 0,
                fatigue: metrics.fatigue || 0,
                ce: metrics.ce || 0
              }
            })
          });
        } catch (error) {
          console.error("Error saving session:", error);
        }
      };

      saveData();
    generateSessionPDF({
  patient: {
    name: patient?.name,
    age: patient?.age,
    affected_side: patient?.affected_side,
    medical_observation: patient?.medical_observation
  },
  metrics,
  score,
  sessionHistory: sessionHistory.current,
  gameMode
});
    }
  }, [gameOver, patientId, gameMode, score, startTime,patient]);

  //Pollito muerto
  useEffect(() => {
  if (!gameOver) return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  drawGame(
    ctx,
    canvas,
    gameState.current,
    livesRef,
    scoreRef,
    effARef,
    difficultyRef,
    true
  );
}, [gameOver]);
  // loop principal
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
   
    const update = () => {
      if (gameOver) return;

      const state = gameState.current;
      state.frame++;

      const now = Date.now();
    const normA = normalizeEMG(effARef.current, maxA);
    const normB = normalizeEMG(effBRef.current, maxB);
    const movementA = normA / 100;
    const movementB = normB / 100;

   
if (now - lastFeedbackTime.current >= FEEDBACK_WINDOW_MS) {
 const fatigueNow = normA >= 85 || normB >= 85;

if (fatigueNow) {
  adaptiveWindow.current.fatigueCount++;
} else {
  adaptiveWindow.current.fatigueCount = 0;
}

state.showFatigue = adaptiveWindow.current.fatigueCount >= 3;
  state.fatiguedChannel = normA > normB ? 'A' : 'B';

  lastFeedbackTime.current = now;
}

if (now - lastSaveTime.current >= SAMPLE_WINDOW_MS) {
        const count = accumulator.current.count || 1;
        const avgA = accumulator.current.a / count;
        const avgB = accumulator.current.b / count;

        if (avgA < 15 && avgB < 15) adaptiveWindow.current.lowActivityCount++;

        sessionHistory.current.push({
          t: new Date(now).toISOString(),
          a: Number(avgA.toFixed(2)),
          b: Number(avgB.toFixed(2))
        });

        accumulator.current = { a: 0, b: 0, count: 0 };
        lastSaveTime.current = now;
      }
         if (now - startTime >= SESSION_DURATION_MS) {
      setGameOver(true);
      return;
    }
      // acumulación por frame
      accumulator.current.a += normA;
      accumulator.current.b += normB;
      accumulator.current.count += 1;

      // adaptación cada 5 segundos
  if (now - lastDifficultyUpdate.current >= 5000) {
  const windowStats = {
    scoreGain: scoreRef.current - adaptiveWindow.current.scoreStart,
    rocksHit: rocksHit.current - adaptiveWindow.current.rocksStart,
    fatigueDetected: adaptiveWindow.current.fatigueCount >= 1,
    inactivityDetected: adaptiveWindow.current.lowActivityCount >= 3
  };
console.log("EMG raw/calibrated:", {
  effA: effARef.current,
  effB: effBRef.current,
  maxA,
  maxB,
  normA,
  normB,
  movementA,
  movementB
});
  console.log("📊 Window stats:", windowStats);

  difficultyRef.current = calculateAdaptiveDifficulty(
    windowStats,
    difficultyRef.current
  );

  console.log("🎚️ Nueva dificultad:", difficultyRef.current);

  adaptiveWindow.current = {
    scoreStart: scoreRef.current,
    rocksStart: rocksHit.current,
    lowActivityCount: 0,
    fatigueCount: 0
  };

  lastDifficultyUpdate.current = now;
}

      // movimiento
          state.chickenX = calculateMovement(
        gameMode,
        movementA,
        movementB,
        state.chickenX
      );
      const level = Math.floor(scoreRef.current / 10);

     const currentSpeed =
  (1.6 + (level * 0.45)) * difficultyRef.current.speedMultiplier;

      if (
        state.worms.length < (3 + level) &&
        Math.random() < difficultyRef.current.wormSpawnRate
      ) {
        state.worms.push({ x: Math.random() * 760, y: -20, offset: Math.random() * 10 });
      }

      if (
        scoreRef.current >= 15 &&
        state.rocks.length < (1 + Math.floor(level + 2)) &&
        Math.random() < difficultyRef.current.rockSpawnRate
      ) {
        state.rocks.push({ x: Math.random() * 760, y: -20 });
      }

      const chickenRect = { x: state.chickenX, y: 440, w: 60, h: 50 };

      state.worms.forEach((w, i) => {
        w.y += currentSpeed;
        if (checkCollision(chickenRect, { x: w.x, y: w.y, w: 40, h: 10 })) {
          setScore(s => s + 1);
          state.worms.splice(i, 1);
        }
      });

      state.rocks.forEach((r, i) => {
        r.y += currentSpeed + 0.8;
        if (checkCollision(chickenRect, { x: r.x - 15, y: r.y - 15, w: 30, h: 30 })) {
          rocksHit.current++;
          livesRef.current--;
          setLives(livesRef.current);
          if (livesRef.current <= 0) setTimeout(() => setGameOver(true), 100);
          state.rocks.splice(i, 1);
        }
      });

      state.worms = state.worms.filter(w => w.y < canvas.height);
      state.rocks = state.rocks.filter(r => r.y < canvas.height);

      drawGame(ctx, canvas, state, livesRef, scoreRef, effARef, difficultyRef, gameOver);

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [gameOver, gameMode, maxA, maxB]);
  const startNewSession = () => {
  setGameOver(false);
  setScore(0);
  setLives(3);

  scoreRef.current = 0;
  livesRef.current = 3;
  rocksHit.current = 0;

  sessionHistory.current = [];
  accumulator.current = { a: 0, b: 0, count: 0 };

  lastSaveTime.current = Date.now();
  lastFeedbackTime.current = Date.now();
  lastDifficultyUpdate.current = Date.now();

  adaptiveWindow.current = {
    scoreStart: 0,
    rocksStart: 0,
    lowActivityCount: 0,
    fatigueCount: 0
  };

  difficultyRef.current = {
    speedMultiplier: 1,
    wormSpawnRate: 0.02,
    rockSpawnRate: 0.002,
    feedbackMessage: null
  };

  gameState.current = {
    chickenX: 400,
    worms: [],
    rocks: [],
    frame: 0,
    showFatigue: false,
    fatiguedChannel: null
  };
  setStartTime(Date.now());
};
  return (
    <div className="game-wrapper">
      <canvas ref={canvasRef} width={800} height={550} className="game-canvas" />
     {gameOver && (
  <div className="game-over-overlay">
    <h2 className="game-over-title">GAME OVER</h2>
    <p className="game-over-score">{score} LOMBRICES RECOLECTADAS</p>

    <div className="game-over-actions">
      <button onClick={startNewSession} className="new-session-btn">
        NUEVA SESIÓN
      </button>

      <button
        onClick={() => window.location.href = '/calibration'}
        className="recalibrate-btn"
      >
        RECALIBRAR
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default ChickenGame;