import React from 'react';
import './css/PatientGameIntroModal.css';

const PatientGameIntroModal = ({ onStart }) => {
  return (
    <div className="game-intro-overlay">
      <div className="game-intro-card">
        <div className="game-intro-icon">🎮</div>

        <h2 className="game-intro-title">
          Phase 2: Let’s Play!
        </h2>

        <p className="game-intro-text">
          Great job completing your calibration. Now your bionic hand signals are ready to control the rehab game.
        </p>

        <div className="game-intro-info">
          <p><strong>How to play</strong></p>

          <ul>
            <li>Use your muscle activation to control the chicken during the game.</li>
            <li>The better your control, the more stable and precise your movement will be.</li>
            <li>Try to reach the targets while avoiding the rocks.</li>
            <li>If you hit rocks, it means your control may need more practice.</li>
            <li>If the system detects fatigue, the game may become easier or slower to help you continue safely.</li>
            <li>Focus on controlled movement, not maximum force.</li>
          </ul>
        </div>

        <p className="game-intro-note">
          Remember: the goal is not only to score points, but to improve control, coordination and endurance safely.
        </p>

        <button
          type="button"
          className="game-intro-button"
          onClick={onStart}
        >
          I’m ready, start game
        </button>
      </div>
    </div>
  );
};

export default PatientGameIntroModal;