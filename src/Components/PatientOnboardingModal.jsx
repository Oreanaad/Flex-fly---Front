import React, { useState } from 'react';
import './css/PatientOnboardingModal.css';

const PatientOnboardingModal = ({ onFinish }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="patient-onboarding-overlay">
      <div className="patient-onboarding-card">

        {step === 1 && (
          <>
            <div className="patient-onboarding-icon">🐔</div>

            <h2 className="patient-onboarding-title">
              Welcome to Kawatek Rehab Game!
            </h2>

            <p className="patient-onboarding-text">
              This platform will guide you through rehabilitation exercises using your bionic hand and muscle activation signals.
            </p>

            <div className="patient-onboarding-info">
              <p><strong>What will you do here?</strong></p>

              <ul>
                <li>Connect your bionic hand and EMG device.</li>
                <li>Calibrate your muscle activation levels.</li>
                <li>Play interactive rehabilitation games.</li>
                <li>Train control, coordination and precision.</li>
                <li>Allow your therapist to review your progress.</li>
              </ul>
            </div>

            <p className="patient-onboarding-note">
              The system will guide you step by step. Take your time and follow the instructions carefully.
            </p>

            <button
              type="button"
              className="patient-onboarding-button"
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="patient-onboarding-icon">⚡</div>

            <h2 className="patient-onboarding-title">
              Phase 1: Calibration
            </h2>

            <p className="patient-onboarding-text">
              Before starting the game, we need to calibrate your muscle signals. This helps the system understand your current strength and movement range.
            </p>

            <div className="patient-onboarding-info">
              <p><strong>Before you start calibration:</strong></p>

              <ul>
                <li>Sit comfortably in a stable position.</li>
                <li>Place your arm in a relaxed and supported position.</li>
                <li>Make sure the EMG sensors are correctly attached.</li>
                <li>Keep your muscles relaxed before pressing start.</li>
                <li>When instructed, contract your muscles gradually.</li>
                <li>Do not force the movement or continue if you feel pain.</li>
                <li>Follow your therapist&apos;s instructions if they are present.</li>
              </ul>
            </div>

            <p className="patient-onboarding-note">
              Calibration allows the game to adapt to your own signal level. Your maximum effort today will become your training reference.
            </p>

            <button
              type="button"
              className="patient-onboarding-button"
              onClick={onFinish}
            >
              I understand, start calibration
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default PatientOnboardingModal;