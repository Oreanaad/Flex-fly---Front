import React, { useRef, useEffect, useState } from 'react';
import { calculateClinicalMetrics } from './clinicalMetrics';
import { drawGame } from './gameVisuals';
import { checkCollision, calculateMovement } from './gameEngine';
import '../../css/ChickenGame.css';

const ChickenGame = ({ eff_A, eff_B, gameMode, patientId }) => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [startTime] = useState(Date.now());
  
  // Referencias para el motor (evitan cierres de ámbito/closures antiguos)
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

  // Sincronización de señales y estado
  useEffect(() => {
    effARef.current = eff_A;
    effBRef.current = eff_B;
  }, [eff_A, eff_B]);

  useEffect(() => {
    scoreRef.current = score;
    livesRef.current = lives;
  }, [score, lives]);

  // --- LÓGICA DE GUARDADO (POSTGRESQL) ---
  useEffect(() => {
    if (gameOver && sessionHistory.current.length > 0) {
      if (!patientId) return console.error("⚠️ Error: patientId requerido.");

      const metrics = calculateClinicalMetrics(sessionHistory.current, score, rocksHit.current, startTime);
      
    const saveData = async () => {
  const API_URL = import.meta.env.VITE_APP_API_URL || 'https://flex-fly-back.onrender.com';
  
  // 1. Preparamos los samples para que coincidan con el backend (a, b, t)
  const formattedSamples = sessionHistory.current.map(s => ({
    t: s.t || s.timestamp || new Date().toISOString(), // Aseguramos que 't' exista
    a: s.a !== undefined ? s.a : (s.valA || s.emgA || 0), // Buscamos posibles nombres de sensor A
    b: s.b !== undefined ? s.b : (s.valB || s.emgB || 0)  // Buscamos posibles nombres de sensor B
  }));
console.log("samples que envío:", formattedSamples);
console.log("metrics que envío:", metrics);
  try {
    const response = await fetch(`${API_URL}/api/save-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        patient_id: patientId, 
        mode: gameMode, 
        score: score, 
        samples: formattedSamples, // <--- Enviamos los datos ya formateados
        metrics: {
          si: metrics.si || 0,
          cr: metrics.cr || 0,
          fatigue: metrics.fatigue || 0,
          ce: metrics.ce || 0
        }
      })
    });
    
    // ... resto de tu lógica de respuesta
  } catch (error) {
    console.error("Error saving session:", error);
  }
};
      saveData();
    }
  }, [gameOver, patientId, gameMode, score, startTime]);

  // --- LOOP PRINCIPAL ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const update = () => {
      if (gameOver) return;
      const state = gameState.current;
      state.frame++;

      // 1. Procesamiento de Fatiga (Mismo protocolo de 1 seg)
     // --- DENTRO DEL LOOP update ---
const now = Date.now();
if (now - lastSaveTime.current >= 1000) {
  // 1. CALCULAMOS LOS PROMEDIOS (Esto faltaba)
  const count = accumulator.current.count || 1;
  const avgA = accumulator.current.a / count;
  const avgB = accumulator.current.b / count;

  // Autocalibración Kawatek
  if (initialBaseline.current.a === null || avgA > initialBaseline.current.a) initialBaseline.current.a = Math.max(avgA, 0.1);
  if (initialBaseline.current.b === null || avgB > initialBaseline.current.b) initialBaseline.current.b = Math.max(avgB, 0.1);

  state.showFatigue = (avgA >= initialBaseline.current.a * 0.9) || (avgB >= initialBaseline.current.b * 0.9);
  state.fatiguedChannel = avgA > avgB ? 'A' : 'B';

  sessionHistory.current.push({ 
    t: new Date(now).toISOString(), 
    a: Number(avgA.toFixed(2)), 
    b: Number(avgB.toFixed(2)) 
  });
  
  // Limpiamos acumulador
  accumulator.current = { a: 0, b: 0, count: 0 };
  lastSaveTime.current = now;
}

// 2. IMPORTANTE: Debes acumular los valores en CADA frame, no solo cada segundo
accumulator.current.a += Number(effARef.current) || 0;
accumulator.current.b += Number(effBRef.current) || 0;
accumulator.current.count += 1;
  
  


      // 2. Movimiento (Llamada a Engine)
      state.chickenX = calculateMovement(gameMode, effARef.current, effBRef.current, state.chickenX);

      // 3. Generación y Dificultad
      const level = Math.floor(scoreRef.current / 10);
      const currentSpeed = 2 + (level * 1.2);
      
      if (state.worms.length < (3 + level) && Math.random() < 0.02) {
        state.worms.push({ x: Math.random() * 760, y: -20, offset: Math.random() * 10 });
      }
      if (scoreRef.current >= 15 && state.rocks.length < (1 + Math.floor(level+2)) && Math.random() < 0.002) {
        state.rocks.push({ x: Math.random() * 760, y: -20 });
      }

      // 4. Colisiones
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
          rocksHit.current += 1;
          livesRef.current -= 1; 
          setLives(livesRef.current);
          if (livesRef.current <= 0) setTimeout(() => setGameOver(true), 100);
          state.rocks.splice(i, 1);
        }
      });

      // Limpieza de objetos fuera de pantalla
      state.worms = state.worms.filter(w => w.y < canvas.height);
      state.rocks = state.rocks.filter(r => r.y < canvas.height);

      // 5. Renderizado (Llamada a Visuals)
      drawGame(ctx, canvas, state, livesRef, scoreRef, effARef);
      
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
          <button onClick={() => window.location.reload()} className="new-session-btn">NUEVA SESIÓN</button>
        </div>
      )}
    </div>
  );
};

export default ChickenGame;