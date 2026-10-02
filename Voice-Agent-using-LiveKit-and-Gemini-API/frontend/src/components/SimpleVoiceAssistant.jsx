import {
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
  useTrackTranscription,
  useLocalParticipant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useMemo } from "react";
import "./SimpleVoiceAssistant.css";

const Message = ({ type, text }) => {
  return (
    <div className="message">
      <strong className={`message-${type}`}>
        {type === "agent" ? "Agent: " : "You: "}
      </strong>
      <span className="message-text">{text}</span>
    </div>
  );
};

const SimpleVoiceAssistant = ({ userName, onMessagesChange }) => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();
  const { segments: userTranscriptions } = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  const messages = useMemo(
    () =>
      [
        {
          id: "local-greeting",
          type: "agent",
          text: `Hi ${userName}, I am Aria from InsureAI Health Insurance. How can I help you today?`,
          firstReceivedTime: 0,
        },
        ...(agentTranscriptions?.map((t) => ({ ...t, type: "agent" })) ?? []),
        ...(userTranscriptions?.map((t) => ({ ...t, type: "user" })) ?? []),
      ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime),
    [agentTranscriptions, userName, userTranscriptions],
  );

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  return (
    <div className="voice-assistant-container">
      <div className="visualizer-container">
        <BarVisualizer state={state} barCount={7} trackRef={audioTrack} />
      </div>
      <div className="control-section">
        <VoiceAssistantControlBar />
        <div className="conversation">
          {messages.map((msg, index) => (
            <Message key={msg.id || index} type={msg.type} text={msg.text} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleVoiceAssistant;
