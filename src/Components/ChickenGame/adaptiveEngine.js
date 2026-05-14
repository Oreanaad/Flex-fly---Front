export const calculateAdaptiveDifficulty = (windowStats, currentDifficulty) => {
  let next = { ...currentDifficulty };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const MIN_SPEED = 0.75;
  const MAX_SPEED = 1.2;

  const MIN_WORM_RATE = 0.015;
  const MAX_WORM_RATE = 0.024;

  const MIN_ROCK_RATE = 0.001;
  const MAX_ROCK_RATE = 0.0024;

  next.feedbackMessage = null;

  if (windowStats.fatigueDetected || windowStats.rocksHit > 0) {
    next.speedMultiplier -= 0.15;
    next.wormSpawnRate -= 0.003;
    next.rockSpawnRate -= 0.0004;
    next.feedbackMessage = 'Take a short rest and move gently';

  } else if (windowStats.scoreGain <= 1) {
    next.speedMultiplier -= 0.08;
    next.wormSpawnRate -= 0.002;
    next.rockSpawnRate -= 0.0002;
    next.feedbackMessage = 'Slowing down to match your control';

  } else if (windowStats.scoreGain >= 3) {
    next.speedMultiplier += 0.04;
    next.wormSpawnRate += 0.001;
    next.rockSpawnRate += 0.0001;
    next.feedbackMessage = 'Good control, small challenge increase';

  } else {
    next.feedbackMessage = 'Keep a steady rhythm';
  }

  next.speedMultiplier = clamp(next.speedMultiplier, MIN_SPEED, MAX_SPEED);
  next.wormSpawnRate = clamp(next.wormSpawnRate, MIN_WORM_RATE, MAX_WORM_RATE);
  next.rockSpawnRate = clamp(next.rockSpawnRate, MIN_ROCK_RATE, MAX_ROCK_RATE);

  return next;
};