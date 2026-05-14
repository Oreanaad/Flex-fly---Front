// Función que dibuja TODO el juego en el canvas en cada frame
// ctx: contexto 2D del canvas
// canvas: elemento canvas
// state: estado interno del juego (pollo, worms, rocks, etc)
// livesRef: vidas actuales (ref)
// scoreRef: score actual (ref)
// effARef: señal EMG A (para animaciones)
export const drawGame = (ctx, canvas, state, livesRef, scoreRef, effARef,difficultyRef, gameOver
) => {

  // 1. Fondo y Suelo

  // Color cielo
  ctx.fillStyle = '#87CEEB';

  // Dibuja fondo completo
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Color del suelo
  ctx.fillStyle = '#228B22';

  // Dibuja el suelo en la parte inferior
  ctx.fillRect(0, 490, canvas.width, 110);


  // 2. Gusanos

  // Recorre cada gusano
  state.worms.forEach(w => {

    // Color rosado del gusano
    ctx.fillStyle = '#FFB6C1';

    // Dibuja el gusano como segmentos ondulados
    for (let i = 0; i < 5; i++) {

      // Calcula movimiento ondulado usando seno
      const segY = w.y + Math.sin(w.offset + i * 0.8) * 3;

      // Empieza un nuevo dibujo
      ctx.beginPath();

      // Dibuja un círculo (segmento)
      ctx.arc(w.x + i * 8, segY, 4, 0, Math.PI * 2);

      // Rellena el círculo
      ctx.fill();
    }
  });


  // 3. Rocas

  // Recorre cada roca
  state.rocks.forEach(r => {

    // Color gris
    ctx.fillStyle = '#505050';

    // Empieza dibujo
    ctx.beginPath();

    // Dibuja círculo de radio 15
    ctx.arc(r.x, r.y, 15, 0, Math.PI * 2);

    // Rellena
    ctx.fill();
  });


  // 4. Pollito (player)

  // Posición del pollo
  ctx.save();

if (gameOver) {
  ctx.translate(state.chickenX + 30, 465);
  ctx.rotate(Math.PI);
  ctx.translate(-state.chickenX - 30, -465);
}

  const x = state.chickenX;
  const y = 440;

  // Cuerpo amarillo
  ctx.fillStyle = 'yellow';
  ctx.beginPath();

  // Dibuja el cuerpo como elipse
  ctx.ellipse(x + 30, y + 25, 30, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ojo
  ctx.fillStyle = 'black';
  ctx.beginPath();
if (gameOver) {
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('X', state.chickenX + 40, 464);
} else {
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(state.chickenX + 40, 458, 4, 0, Math.PI * 2);
  ctx.fill();
}

  // Pico
  ctx.fillStyle = '#FF8000';
  ctx.beginPath();
  ctx.moveTo(x + 55, y + 20);
  ctx.lineTo(x + 65, y + 25);
  ctx.lineTo(x + 55, y + 30);
  ctx.fill();
  
  // Animación del ala basada en frame + señal EMG
  const wingFlap = Math.sin(state.frame * 0.2) * (10 + effARef.current * 20);

  // Color del ala
  ctx.fillStyle = '#FDE047';

  ctx.beginPath();

  // Dibuja ala con rotación dependiente de wingFlap
  ctx.ellipse(
    x + 20,
    y + 25,
    15,
    5 + Math.abs(wingFlap)/4,
    wingFlap * Math.PI / 180,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // Borde del ala
  ctx.strokeStyle = '#EAB308';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 5. UI (vidas y score)

  // Fondo semitransparente UI izquierda
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.roundRect(25, 20, 120, 45, 10);
  ctx.fill();

  // Fondo semitransparente UI derecha
  ctx.beginPath();
  ctx.roundRect(canvas.width - 140, 20, 120, 45, 10);
  ctx.fill();

  // Texto vidas
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';

  // Muestra corazones según vidas actuales
  ctx.fillText('❤️ '.repeat(livesRef.current), 35, 52); 

  // Texto score
  ctx.textAlign = 'right'; 

  // Muestra score con icono gusano
  ctx.fillText(`🪱 ${scoreRef.current}`, canvas.width - 55, 52); 


  // 6. Alerta de Fatiga
// 6. MENSAJE ÚNICO DE FEEDBACK

let feedbackTitle = null;
let feedbackSubtitle = null;
let feedbackIsFatigue = false;

if (state.showFatigue) {
  const muscleName = state.fatiguedChannel === 'A'
    ? 'FLEXOR'
    : 'EXTENSOR';

  const channelName = state.fatiguedChannel === 'A'
    ? 'Canal A'
    : 'Canal B';

  feedbackTitle = '⚠️ ESFUERZO ELEVADO';
  feedbackSubtitle = `Relajá el ${muscleName} (${channelName})`;
  feedbackIsFatigue = true;

} else if (difficultyRef.current.feedbackMessage) {
  feedbackTitle = difficultyRef.current.feedbackMessage;
}
if (feedbackTitle) {
  const pulse = Math.abs(Math.sin(state.frame * 0.1));

  ctx.fillStyle = feedbackIsFatigue
    ? `rgba(220, 38, 38, ${0.75 + pulse * 0.25})`
    : 'rgba(0, 0, 0, 0.6)';

  const boxWidth = 460;
  const boxHeight = feedbackSubtitle ? 76 : 54;
  const boxX = (canvas.width - boxWidth) / 2;
  const boxY = 75;

  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 18);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';

  ctx.font = 'bold 20px Arial';
  ctx.fillText(feedbackTitle, canvas.width / 2, boxY + 32);

  if (feedbackSubtitle) {
    ctx.font = '16px Arial';
    ctx.fillText(feedbackSubtitle, canvas.width / 2, boxY + 58);
  }
}
}