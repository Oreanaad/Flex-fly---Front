// Función para detectar colisiones entre dos rectángulos
// r1 y r2 deben tener la forma: { x, y, w, h }
export const checkCollision = (r1, r2) => (
  // Verifica si el lado izquierdo de r1 está antes del lado derecho de r2
  r1.x < r2.x + r2.w &&

  // Verifica si el lado derecho de r1 está después del lado izquierdo de r2
  r1.x + r1.w > r2.x &&

  // Verifica si la parte superior de r1 está por encima de la parte inferior de r2
  r1.y < r2.y + r2.h &&

  // Verifica si la parte inferior de r1 está por debajo de la parte superior de r2
  r1.y + r1.h > r2.y
);

// Función que calcula el movimiento horizontal del personaje (pollo)
// gameMode: modo del juego (FLEXION, EXTENSION, etc.)
// effA: señal EMG del canal A
// effB: señal EMG del canal B
// currentX: posición actual en el eje X
export const calculateMovement = (gameMode, effA, effB, currentX) => {

  // Velocidad base de movimiento (escala cuánto influye la señal EMG)
  const SPEED_MOVE = 18.0;

  // Fuerza constante que simula gravedad o resistencia
  const GRAVITY_FORCE = 3.5;

  // Inicializa nueva posición con la actual
  let newX = currentX;

  // Decide cómo moverse según el modo de juego
  switch (gameMode) {

    // Modo flexión (control con músculo A)
    case "FLEXION":
    case "FLEX":
      // Aumenta posición según señal A y le resta gravedad
      newX += (effA * SPEED_MOVE) - GRAVITY_FORCE;
      break;

    // Modo extensión (control con músculo B)
    case "EXTENSION":
    case "EXT":
      // Disminuye posición según señal B y le suma gravedad
      newX += GRAVITY_FORCE - (effB * SPEED_MOVE);
      break;

    // Modo por defecto (control diferencial A vs B)
    default:
      // Se mueve según la diferencia entre ambas señales
      newX += (effA - effB) * SPEED_MOVE;
  }
  
  // Límites de pantalla

  // Si se pasa del borde izquierdo, lo fija en 0
  if (newX < 0) newX = 0;

  // Si se pasa del borde derecho, lo fija en 740 (canvas width - ancho del pollo)
  if (newX > 740) newX = 740;
  
  // Devuelve la nueva posición calculada
  return newX;
};