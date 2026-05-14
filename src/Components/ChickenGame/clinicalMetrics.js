// Mantiene la lógica original de cálculo de métricas clínicas
// Recibe:
// history: array de muestras [{a, b, t}]
// score: puntaje final
// rocksHit: cantidad de errores (rocas)
// startTime: timestamp de inicio de sesión

export const calculateClinicalMetrics = (history, score, rocksHit, startTime) => {
  // Si no hay datos, devuelve todas las métricas en 0
  if (history.length === 0) return { si: 0, cr: 0, fatigue: 0, ce: 0 };

  // Umbral de activación muscular (por encima de esto se considera “activo”)
  const ACTIVATION_THRESHOLD = 0.15; 
  
  // Contador de tiempo total donde hay actividad muscular en al menos un canal
  let t_muscle_activity = 0;

  // Contadores de tipo de activación
  let t_selective_a = 0, t_selective_b = 0, t_coactivation = 0;

  // Recorre todas las muestras de la sesión
  history.forEach(s => {
    // Determina si el canal A está activo según el umbral
    const actA = s.a > ACTIVATION_THRESHOLD;

    // Determina si el canal B está activo según el umbral
    const actB = s.b > ACTIVATION_THRESHOLD;

    // Si al menos un canal está activo, suma tiempo de actividad
    if (actA || actB) t_muscle_activity++;

    // Activación selectiva A (A activo, B no)
    if (actA && !actB) t_selective_a++;

    // Activación selectiva B (B activo, A no)
    if (!actA && actB) t_selective_b++;

    // Co-activación (ambos activos al mismo tiempo)
    if (actA && actB) t_coactivation++;
  });

  // SI (Selectivity Index)
  // Proporción de activaciones selectivas respecto al total de actividad
  const si = t_muscle_activity > 0 
    ? (t_selective_a + t_selective_b) / t_muscle_activity 
    : 0;

  // CR (Coactivation Ratio)
  // Porcentaje de co-activación respecto al total de actividad
  const cr = t_muscle_activity > 0 
    ? (t_coactivation / t_muscle_activity) * 100 
    : 0;
  
  // Toma las primeras 5 muestras de la sesión
  const firstSamples = history.slice(0, 5); 

  // Toma las últimas 5 muestras de la sesión
  const lastSamples = history.slice(-5);

  // Promedio inicial: toma el máximo entre A y B en cada muestra (mayor esfuerzo)
  const avgInitial = firstSamples.length > 0 
    ? firstSamples.reduce((acc, val) => acc + Math.max(val.a, val.b), 0) / firstSamples.length 
    : 0;

  // Promedio final con la misma lógica
  const avgFinal = lastSamples.length > 0 
    ? lastSamples.reduce((acc, val) => acc + Math.max(val.a, val.b), 0) / lastSamples.length 
    : 0;

  // Fatigue (Fatiga)
  // Mide la caída de rendimiento desde el inicio al final
  const fatigue = avgInitial > 0 
    ? (1 - (avgFinal / avgInitial)) * 100 
    : 0;

  // Duración de la sesión en minutos
  const sessionMinutes = (Date.now() - startTime) / 60000;

  // CE (Control Efficiency)
  // Relaciona rendimiento (score) con errores (rocksHit) por tiempo
  const ce = sessionMinutes > 0 
    ? (score - (rocksHit * 1.5)) / sessionMinutes 
    : 0;

  // Devuelve métricas con 2 decimales
  return { 
    si: parseFloat(si.toFixed(2)), 
    cr: parseFloat(cr.toFixed(2)), 
    fatigue: parseFloat(fatigue.toFixed(2)),
    ce: parseFloat(ce.toFixed(2))
  };
};