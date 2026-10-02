import { useState, useCallback } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import SimpleVoiceAssistant from "./SimpleVoiceAssistant";

const LiveKitModal = ({ setShowSupport }) => {
  const [isSubmittingName, setIsSubmittingName] = useState(true);
  const [name, setName] = useState("");
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [messages, setMessages] = useState([]);

  const getToken = useCallback(async (userName) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/token?user=${encodeURIComponent(userName)}`,
      );
      const data = await response.json();
      setToken(data.token);
      setShowSummary(false);
      setIsSubmittingName(false);
    } catch (error) {
      console.error("Error fetching token:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      getToken(name);
    }
  };

  const resetConsultation = () => {
    setToken(null);
    setMessages([]);
    setShowSummary(false);
    setIsSubmittingName(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="support-room">
          {showSummary ? (
            <section className="summary-page">
              <div className="summary-mark">✓</div>
              <p className="summary-kicker">InsureAI consultation complete</p>
              <h2>Conversation output</h2>
              <p className="summary-intro">
                Thanks, {name}. Your conversation has been captured for
                follow-up.
              </p>
              <div className="summary-status">
                <span className="summary-status-dot" />
                Qualification session completed
              </div>
              <div className="summary-transcript">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div className="summary-message" key={message.id || index}>
                      <strong>
                        {message.type === "agent" ? "InsureAI" : name}
                      </strong>
                      <span>{message.text}</span>
                    </div>
                  ))
                ) : (
                  <p>No transcript was received before the call ended.</p>
                )}
              </div>
              <button
                type="button"
                className="summary-button"
                onClick={resetConsultation}
              >
                Start another consultation
              </button>
              <button
                type="button"
                className="summary-close"
                onClick={() => setShowSupport(false)}
              >
                Close summary
              </button>
            </section>
          ) : isSubmittingName ? (
            isLoading ? (
              <div className="loading">
                <div className="loading-spinner" />
                Connecting to your AI advisor…
              </div>
            ) : (
              <form onSubmit={handleNameSubmit} className="name-form">
                <div className="name-form-icon">🛡</div>
                <h2>Start your free health insurance consultation</h2>
                <p>
                  Our AI advisor will ask you a few quick questions to find the
                  best plan for you — no commitment required.
                </p>
                <input
                  id="user-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  required
                  autoFocus
                />
                <button type="submit" id="connect-button">
                  Start Consultation
                </button>
                <button
                  type="button"
                  id="cancel-button"
                  className="cancel-button"
                  onClick={() => setShowSupport(false)}
                >
                  Maybe later
                </button>
              </form>
            )
          ) : token ? (
            <LiveKitRoom
              serverUrl={import.meta.env.VITE_LIVEKIT_URL}
              token={token}
              connect={true}
              video={false}
              audio={true}
              onConnected={() => {
                const greeting = `Hi ${name}, I am Aria from InsureAI Health Insurance. I am ready to help you find the right health plan.`;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(
                  new SpeechSynthesisUtterance(greeting),
                );
              }}
              onDisconnected={() => {
                window.speechSynthesis.cancel();
                setToken(null);
                setShowSummary(true);
                setIsSubmittingName(false);
              }}
            >
              <RoomAudioRenderer />
              <SimpleVoiceAssistant
                userName={name}
                onMessagesChange={setMessages}
              />
            </LiveKitRoom>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LiveKitModal;
