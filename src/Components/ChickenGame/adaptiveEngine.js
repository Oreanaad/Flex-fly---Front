export const calculateAdaptiveDifficulty = (windowStats, currentDifficulty) => {
  console.log("🧠 adaptiveEngine recibió:", windowStats);

  let next = { ...currentDifficulty };
if (windowStats.fatigueDetected || windowStats.rocksHit >= 1) {
  next.speedMultiplier = Math.max(0.7, next.speedMultiplier - 0.1);
  next.wormSpawnRate = Math.max(0.01, next.wormSpawnRate - 0.002);
  next.rockSpawnRate = Math.max(0.0005, next.rockSpawnRate - 0.0003);
  next.feedbackMessage = "Take a short rest and move gently";
} else if (windowStats.scoreGain >= 3 && windowStats.rocksHit === 0 && !windowStats.inactivityDetected) {
  next.speedMultiplier = Math.min(1.6, next.speedMultiplier + 0.1);
  next.wormSpawnRate = Math.min(0.04, next.wormSpawnRate + 0.002);
  next.rockSpawnRate = Math.min(0.006, next.rockSpawnRate + 0.0003);
  next.feedbackMessage = "Great control, keep it steady";
} else if (windowStats.inactivityDetected) {
  next.feedbackMessage = "Activate a bit more to keep moving";
} else {
  next.feedbackMessage = null;
}

  return next;
};