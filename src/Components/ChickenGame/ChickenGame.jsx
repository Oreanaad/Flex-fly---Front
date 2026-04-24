import React, { useRef, useEffect, useState } from 'react';
import { calculateClinicalMetrics } from './clinicalMetrics';
import { drawGame } from './gameVisuals';
import { checkCollision, calculateMovement } from './gameEngine';
import '../../css/ChickenGame.css';
import { calculateAdaptiveDifficulty } from './adaptiveEngine';

const ChickenGame = ({ eff_A, eff_B, gameMode, patientId }) => {
  const canvasRef = useRef(null);

  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [startTime] = useState(Date.now());

  // refs para evitar stale state dentro del loop
  const effARef = useRef(0);
  const effBRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

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

  const accumulator = useRef({ a: 0, b: 0, count: 0 });
  const lastSaveTime = useRef(Date.now());
  const initialBaseline = useRef({ a: null, b: null });

  // capa adaptativa
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
    }
  }, [gameOver, patientId, gameMode, score, startTime]);

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

      // procesamiento cada 1 segundo
      if (now - lastSaveTime.current >= 1000) {
        const count = accumulator.current.count || 1;
        const avgA = accumulator.current.a / count;
        const avgB = accumulator.current.b / count;

        if (initialBaseline.current.a === null || avgA > initialBaseline.current.a)
          initialBaseline.current.a = Math.max(avgA, 0.1);

        if (initialBaseline.current.b === null || avgB > initialBaseline.current.b)
          initialBaseline.current.b = Math.max(avgB, 0.1);

        state.showFatigue =
          (avgA >= initialBaseline.current.a * 0.9) ||
          (avgB >= initialBaseline.current.b * 0.9);

        state.fatiguedChannel = avgA > avgB ? 'A' : 'B';

        if (state.showFatigue) adaptiveWindow.current.fatigueCount++;
        if (avgA < 0.15 && avgB < 0.15) adaptiveWindow.current.lowActivityCount++;

        sessionHistory.current.push({
          t: new Date(now).toISOString(),
          a: Number(avgA.toFixed(2)),
          b: Number(avgB.toFixed(2))
        });

        accumulator.current = { a: 0, b: 0, count: 0 };
        lastSaveTime.current = now;
      }

      // acumulación por frame
      accumulator.current.a += Number(effARef.current) || 0;
      accumulator.current.b += Number(effBRef.current) || 0;
      accumulator.current.count += 1;

      // adaptación cada 5 segundos
  if (now - lastDifficultyUpdate.current >= 5000) {
  const windowStats = {
    scoreGain: scoreRef.current - adaptiveWindow.current.scoreStart,
    rocksHit: rocksHit.current - adaptiveWindow.current.rocksStart,
    fatigueDetected: adaptiveWindow.current.fatigueCount >= 2,
    inactivityDetected: adaptiveWindow.current.lowActivityCount >= 3
  };

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
        effARef.current,
        effBRef.current,
        state.chickenX
      );

      const level = Math.floor(scoreRef.current / 10);

      const currentSpeed =
        (2 + (level * 1.2)) * difficultyRef.current.speedMultiplier;

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

      drawGame(ctx, canvas, state, livesRef, scoreRef, effARef, difficultyRef);

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [gameOver, gameMode]);

  return (
    <div className="game-wrapper">
      <canvas ref={canvasRef} width={800} height={550} className="game-canvas" />
      {gameOver && (
        <div className="game-over-overlay">
          <h2 className="game-over-title">SESIÓN TERMINADA</h2>
          <p className="game-over-score">{score} LOMBRICES RECOLECTADAS</p>
          <button onClick={() => window.location.reload()} className="new-session-btn">
            NUEVA SESIÓN
          </button>
        </div>
      )}
    </div>
  );
};

export default ChickenGame;