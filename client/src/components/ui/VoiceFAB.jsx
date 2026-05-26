import { useState } from 'react';
import { useVoice } from '../../hooks/useVoice';
import { useAuthStore } from '../../store/authStore';
import { Mic, MicOff, X } from 'lucide-react';

export function VoiceFAB({ toast }) {
  const { user } = useAuthStore();
  const [transcript, setTranscript] = useState('');
  const [showBubble, setShowBubble] = useState(false);

  const { listening, supported, startListening, stopListening } = useVoice({
    username: user?.username,
    onTranscript: (t) => {
      setTranscript(t);
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    },
  });

  if (!supported || !user) return null;

  return (
    <div className="voice-fab-wrapper">
      {showBubble && transcript && (
        <div className="voice-bubble">
          <span>"{transcript}"</span>
          <button onClick={() => setShowBubble(false)}><X size={12} /></button>
        </div>
      )}
      <button
        className={`voice-fab ${listening ? 'voice-fab--active' : ''}`}
        onClick={listening ? stopListening : startListening}
        title={listening ? 'Stop listening' : 'Voice command'}
      >
        {listening ? <MicOff size={22} /> : <Mic size={22} />}
        {listening && <span className="voice-fab__ring" />}
      </button>
    </div>
  );
}