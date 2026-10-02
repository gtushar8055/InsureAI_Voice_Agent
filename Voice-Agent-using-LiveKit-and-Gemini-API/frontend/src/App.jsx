import { useState } from "react";
import "./App.css";
import LiveKitModal from "./components/LiveKitModal";

function App() {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🛡</span>
          InsureAI
        </div>
        <span className="header-badge">
          Health Insurance · AI Qualification
        </span>
      </header>

      <main>
        <section className="hero-section">
          <span className="hero-eyebrow">Powered by LiveKit + Gemini RAG</span>

          <h1 className="hero-title">
            Your <span className="gradient-word">AI Insurance</span>
            <br />
            Advisor, Available 24/7
          </h1>

          <p className="hero-subtitle">
            Speak naturally to qualify for health insurance plans, get policy
            answers grounded in real documents, and escalate to a human agent —
            instantly.
          </p>

          <div className="capability-pills">
            {[
              "RAG-Grounded Answers",
              "Objection Handling",
              "Lead Qualification",
              "Human Escalation",
              "Safe Fallback",
            ].map((label) => (
              <span className="pill" key={label}>
                <span className="pill-dot" />
                {label}
              </span>
            ))}
          </div>

          <button
            id="start-voice-agent"
            className="support-button"
            onClick={() => setShowSupport(true)}
          >
            <span className="button-pulse" />
            Talk to an AI Agent
          </button>

          <div className="trust-row">
            <span className="trust-item">
              <span className="trust-check">✓</span> No hallucinated answers
            </span>
            <span className="trust-divider" />
            <span className="trust-item">
              <span className="trust-check">✓</span> Knowledge-base grounded
            </span>
            <span className="trust-divider" />
            <span className="trust-item">
              <span className="trust-check">✓</span> Sub-200ms latency
            </span>
          </div>
        </section>
      </main>

      {showSupport && <LiveKitModal setShowSupport={setShowSupport} />}
    </div>
  );
}

export default App;
