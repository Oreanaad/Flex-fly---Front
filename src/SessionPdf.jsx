import jsPDF from "jspdf";

export const generateSessionPDF = ({ patient, metrics, score, sessionHistory, gameMode }) => {
  const doc = new jsPDF();

  const avg = (field) =>
    sessionHistory.length
      ? sessionHistory.reduce((acc, s) => acc + Number(s[field] || 0), 0) / sessionHistory.length
      : 0;

  const avgA = avg("a").toFixed(1);
  const avgB = avg("b").toFixed(1);
  const maxAValue = Math.max(...sessionHistory.map(s => Number(s.a || 0))).toFixed(1);
  const maxBValue = Math.max(...sessionHistory.map(s => Number(s.b || 0))).toFixed(1);

  // HEADER
  doc.setFillColor(33, 37, 41);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("EMG Training Session Report", 15, 18);

  // RESET COLOR
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  // DATOS PACIENTE
  doc.text(`Patient: ${patient?.name || "N/A"}`, 15, 42);
  doc.text(`Patient ID: ${patient?.id_number || patient?.id || "N/A"}`, 15, 50);
  doc.text(`Age: ${patient?.age || "N/A"}`, 15, 58);
  doc.text(`Affected side: ${patient?.affected_side || "N/A"}`, 15, 66);

  const observation = patient?.condition|| patient?.condition || "N/A";
  doc.text("Medical observation:", 15, 76);
  doc.text(doc.splitTextToSize(observation, 180), 15, 84);

  doc.text(`Mode: ${gameMode}`, 15, 104);
  doc.text(`Date: ${new Date().toLocaleString()}`, 15, 112);

  // SESSION SUMMARY
  doc.setFontSize(14);
  doc.text("Session Summary", 15, 132);

  doc.setFontSize(11);
  doc.text(`Score: ${score}`, 15, 144);
  doc.text(`Samples: ${sessionHistory.length}`, 15, 152);
  doc.text(`Average Channel A: ${avgA}%`, 15, 160);
  doc.text(`Average Channel B: ${avgB}%`, 15, 168);
  doc.text(`Max Channel A: ${maxAValue}%`, 110, 160);
  doc.text(`Max Channel B: ${maxBValue}%`, 110, 168);

  // CLINICAL METRICS
  doc.setFontSize(14);
  doc.text("Clinical Metrics", 15, 188);

  doc.setFontSize(11);
  doc.text(`Selectivity Index (SI): ${metrics.si}`, 15, 200);
  doc.text(`Coactivation Ratio (CR): ${metrics.cr}%`, 15, 208);
  doc.text(`Fatigue Trend: ${metrics.fatigue}%`, 15, 216);
  doc.text(`Control Efficiency (CE): ${metrics.ce}`, 15, 224);

  // RECOMMENDATION
  let recommendation = "Continue training with the current difficulty.";

  if (metrics.fatigue > 30) {
    recommendation = "High fatigue detected. Reduce intensity and increase rest time.";
  } else if (metrics.cr > 35) {
    recommendation = "High coactivation detected. Focus on isolated muscle activation.";
  } else if (metrics.si < 0.6) {
    recommendation = "Low selectivity. Continue with basic control exercises.";
  } else if (metrics.si >= 0.75 && metrics.cr < 20) {
    recommendation = "Good selective control. Patient may progress gradually.";
  }

  doc.setFontSize(14);
  doc.text("Recommendation", 15, 244);

  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(recommendation, 180), 15, 254);

  // FOOTER
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Generated automatically by Kawatek EMG Training System", 15, 285);

  doc.save(`EMG_Report_${patient?.name || "patient"}_${Date.now()}.pdf`);
};