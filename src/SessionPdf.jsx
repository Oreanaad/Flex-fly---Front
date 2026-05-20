import jsPDF from "jspdf";
import { calculateClinicalMetrics } from "./Components/ChickenGame/clinicalMetrics";

export const generateSessionPDF = ({
  patient,
  metrics,
  score,
  sessionHistory,
  gameMode
}) => {
  const doc = new jsPDF();

  const PAGE_WIDTH = 210;
  const MARGIN_X = 15;

  const CARD_BG = [248, 250, 252];
  const DARK = [15, 23, 42];
  const TEXT = [51, 65, 85];
  const MUTED = [100, 116, 139];
  const TEAL = [20, 184, 166];
  const YELLOW = [250, 204, 21];

  const safeHistory = Array.isArray(sessionHistory) ? sessionHistory : [];

  const format = (value, decimals = 1) => {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n.toFixed(decimals) : "0.0";
  };

  const avg = (samples, field) => {
    if (!samples.length) return 0;

    return (
      samples.reduce((acc, s) => acc + Number(s[field] || 0), 0) /
      samples.length
    );
  };

  const max = (samples, field) => {
    if (!samples.length) return 0;

    return Math.max(...samples.map((s) => Number(s[field] || 0)));
  };

  const getRecommendation = (m) => {
    if (!m) return "Not enough data to generate a recommendation.";

    if (Number(m.fatigue) > 30) {
      return "High fatigue detected. Reduce intensity and increase rest time before continuing.";
    }

    if (Number(m.cr) > 35) {
      return "High coactivation detected. Focus on isolated and controlled muscle activation.";
    }

    if (Number(m.si) < 0.6) {
      return "Low selectivity detected. Continue with basic control exercises before increasing difficulty.";
    }

    if (Number(m.si) >= 0.75 && Number(m.cr) < 20) {
      return "Good selective control. Patient may progress gradually while maintaining safe effort levels.";
    }

    return "Continue training with the current difficulty and monitor fatigue across sessions.";
  };

  const drawHeader = (title, subtitle) => {
    doc.setFillColor(...DARK);
    doc.rect(0, 0, PAGE_WIDTH, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    doc.text(title, MARGIN_X, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(subtitle, MARGIN_X, 26);

    doc.setTextColor(0, 0, 0);
  };

  const drawFooter = (label) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN_X, 282, 195, 282);

    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      "Generated automatically by Kawatek EMG Training System",
      MARGIN_X,
      288
    );
    doc.text(label, 165, 288);

    doc.setTextColor(0, 0, 0);
  };

  const drawCard = (x, y, w, h, title) => {
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, w, h, 4, 4, "FD");

    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, x + 6, y + 10);

    doc.setFont("helvetica", "normal");
  };

  const drawMetricRow = (
    items,
    y,
    boxWidth = 38,
    boxHeight = 24,
    gap = 5
  ) => {
    const totalWidth = items.length * boxWidth + (items.length - 1) * gap;
    const startX = (PAGE_WIDTH - totalWidth) / 2;

    items.forEach((item, index) => {
      const x = startX + index * (boxWidth + gap);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, boxWidth, boxHeight, 4, 4, "FD");

      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, x + 5, y + 8);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...item.color);
      doc.text(String(item.value), x + 5, y + 18);

      doc.setFont("helvetica", "normal");
    });
  };

  const drawPatientInfo = (y = 42) => {
    drawCard(MARGIN_X, y, 180, 54, "Patient Information");

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);

    doc.text(`Patient: ${patient?.name || "N/A"}`, MARGIN_X + 6, y + 22);
    doc.text(
      `Patient ID: ${patient?.id || patient?.clinical_patient_id || "N/A"}`,
      MARGIN_X + 6,
      y + 31
    );
    doc.text(`Age: ${patient?.age || "N/A"}`, MARGIN_X + 6, y + 40);
    doc.text(
      `Affected side: ${patient?.affected_side || "N/A"}`,
      MARGIN_X + 6,
      y + 49
    );

    doc.text(`Mode: ${gameMode || "N/A"}`, 105, y + 22);
    doc.text(`Date: ${new Date().toLocaleString()}`, 105, y + 31);
    doc.text(`Serial: ${patient?.serial_number || "N/A"}`, 105, y + 40);
    doc.text(`Email: ${patient?.email || "N/A"}`, 105, y + 49);
  };

  const drawClinicalObservation = (y = 104) => {
    const observation =
      patient?.condition || patient?.medical_observation || "N/A";

    drawCard(MARGIN_X, y, 180, 34, "Clinical Observation");

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(doc.splitTextToSize(observation, 168), MARGIN_X + 6, y + 22);
  };

  const getSamplesByMinute = () => {
    const buckets = [[], [], [], []];

    if (!safeHistory.length) return buckets;

    const firstTimestamp = safeHistory[0]?.t
      ? new Date(safeHistory[0].t).getTime()
      : null;

    safeHistory.forEach((sample, index) => {
      let minuteIndex = 0;

      if (sample?.t && firstTimestamp) {
        const sampleTime = new Date(sample.t).getTime();
        const elapsedMs = sampleTime - firstTimestamp;
        minuteIndex = Math.floor(elapsedMs / 60000);
      } else {
        minuteIndex = Math.floor((index / safeHistory.length) * 4);
      }

      if (minuteIndex < 0) minuteIndex = 0;
      if (minuteIndex > 3) minuteIndex = 3;

      buckets[minuteIndex].push(sample);
    });

    return buckets;
  };

  const drawMinutePage = (minuteNumber, samples) => {
    const minuteScoreEstimate = Math.round((score || 0) / 4);

    const minuteMetrics = calculateClinicalMetrics(
      samples,
      minuteScoreEstimate,
      0,
      Date.now()
    );

    const avgA = avg(samples, "a");
    const avgB = avg(samples, "b");
    const maxA = max(samples, "a");
    const maxB = max(samples, "b");

    drawHeader(
      `EMG Training Report - Minute ${minuteNumber}`,
      "One-minute rehabilitation performance summary"
    );

    drawPatientInfo(42);
    drawClinicalObservation(104);

    drawCard(MARGIN_X, 148, 180, 50, `Minute ${minuteNumber} EMG Summary`);

    drawMetricRow(
      [
        {
          label: "Samples",
          value: samples.length,
          color: TEAL
        },
        {
          label: "Avg A",
          value: `${format(avgA)}%`,
          color: TEAL
        },
        {
          label: "Avg B",
          value: `${format(avgB)}%`,
          color: TEAL
        },
        {
          label: "Max A/B",
          value: `${format(maxA)} / ${format(maxB)}`,
          color: YELLOW
        }
      ],
      164
    );

    drawCard(MARGIN_X, 208, 180, 42, "Clinical Metrics");

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);

    doc.text(
      `Selectivity Index (SI): ${format(minuteMetrics.si, 2)}`,
      MARGIN_X + 6,
      226
    );
    doc.text(
      `Coactivation Ratio (CR): ${format(minuteMetrics.cr)}%`,
      MARGIN_X + 6,
      236
    );
    doc.text(
      `Fatigue Trend: ${format(minuteMetrics.fatigue)}%`,
      105,
      226
    );
    doc.text(
      `Control Efficiency (CE): ${format(minuteMetrics.ce, 2)}`,
      105,
      236
    );

    const recommendation = getRecommendation(minuteMetrics);

    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text("Minute Recommendation", MARGIN_X, 260);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(doc.splitTextToSize(recommendation, 180), MARGIN_X, 270);

    drawFooter(`Minute ${minuteNumber}/4`);
  };

  const drawConclusionPage = (samplesByMinute) => {
    const avgA = avg(safeHistory, "a");
    const avgB = avg(safeHistory, "b");
    const maxA = max(safeHistory, "a");
    const maxB = max(safeHistory, "b");

    const finalRecommendation = getRecommendation(metrics);

    drawHeader(
      "Final EMG Training Session Conclusion",
      "Complete four-minute session clinical summary"
    );

    drawPatientInfo(42);
    drawClinicalObservation(104);

    drawCard(MARGIN_X, 148, 180, 50, "Complete Session Summary");

    drawMetricRow(
      [
        {
          label: "Score",
          value: score || 0,
          color: TEAL
        },
        {
          label: "Samples",
          value: safeHistory.length,
          color: TEAL
        },
        {
          label: "Avg A/B",
          value: `${format(avgA)} / ${format(avgB)}`,
          color: TEAL
        },
        {
          label: "Max A/B",
          value: `${format(maxA)} / ${format(maxB)}`,
          color: YELLOW
        }
      ],
      164
    );

    drawCard(MARGIN_X, 208, 85, 48, "Final Metrics");

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(`SI: ${format(metrics.si, 2)}`, MARGIN_X + 6, 226);
    doc.text(`CR: ${format(metrics.cr)}%`, MARGIN_X + 6, 236);
    doc.text(`Fatigue: ${format(metrics.fatigue)}%`, MARGIN_X + 6, 246);

    drawCard(110, 208, 85, 48, "Minute Samples");

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    samplesByMinute.forEach((samples, index) => {
      doc.text(`Minute ${index + 1}: ${samples.length} samples`, 116, 226 + index * 8);
    });

    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text("Final Clinical Interpretation", MARGIN_X, 268);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(doc.splitTextToSize(finalRecommendation, 180), MARGIN_X, 278);

    drawFooter("Final conclusion");
  };

  const samplesByMinute = getSamplesByMinute();

  samplesByMinute.forEach((samples, index) => {
    if (index > 0) doc.addPage();
    drawMinutePage(index + 1, samples);
  });

  doc.addPage();
  drawConclusionPage(samplesByMinute);

  const safePatientName = (patient?.name || "patient")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");

  doc.save(`EMG_Report_${safePatientName}_${Date.now()}.pdf`);
};