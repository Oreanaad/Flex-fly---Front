// Función que dibuja TODO el juego en el canvas en cada frame
// ctx: contexto 2D del canvas
// canvas: elemento canvas
// state: estado interno del juego (pollo, worms, rocks, etc)
// livesRef: vidas actuales (ref)
// scoreRef: score actual (ref)
// effARef: señal EMG A (para animaciones)
export const drawGame = (ctx, canvas, state, livesRef, scoreRef, effARef,difficultyRef) => {

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
  ctx.arc(x + 45, y + 15, 3, 0, Math.PI * 2);
  ctx.fill();

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

  // Si hay fatiga activa
  if (state.showFatigue) {

    // Animación de pulso (parpadeo)
    const pulse = Math.abs(Math.sin(state.frame * 0.1));

    // Color rojo con opacidad variable
    ctx.fillStyle = `rgba(220, 38, 38, ${0.7 + pulse * 0.3})`;

    // Ancho del mensaje
    const msgWidth = 360;

    // Determina nombre del músculo según canal
    const muscleName = state.fatiguedChannel === 'A'
      ? 'FLEXOR (Canal A)'
      : 'EXTENSOR (Canal B)';

    // Centra el mensaje
    const msgX = (canvas.width - msgWidth) / 2;

    ctx.beginPath();

    // Dibuja fondo del mensaje
    ctx.roundRect(msgX, 100, msgWidth, 75, 20);
    ctx.fill();

    // Texto principal
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('⚠️ ESFUERZO ELEVADO', canvas.width / 2, 135);

    // Texto secundario
    ctx.font = '14px Arial'; 
    ctx.fillText(`RELAJA EL ${muscleName}`, canvas.width / 2, 160);
  }
  if (difficultyRef.current.feedbackMessage) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(200, 50, 400, 50);

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = '16px Arial';
  ctx.fillText(difficultyRef.current.feedbackMessage, canvas.width / 2, 80);
}
};
