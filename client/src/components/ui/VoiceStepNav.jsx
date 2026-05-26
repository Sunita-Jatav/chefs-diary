import { useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import { useAuthStore } from '../../store/authStore';

export function VoiceStepNav({ steps, currentStep, onStepChange, onDictate, toast }) {
  const { user } = useAuthStore();
  const [speaking, setSpeaking] = useState(false);

  const { listening, supported, startListening, stopListening, speak, stopSpeaking } = useVoice({
    username: user?.username,
    onTranscript: (t) => onDictate?.(t), // pipe to Sous Chef
    onCommand: (cmd) => {
      if (cmd.includes('next step') || cmd.includes('next'))
        onStepChange(Math.min(currentStep + 1, steps.length - 1));
      else if (cmd.includes('previous') || cmd.includes('prev') || cmd.includes('back'))
        onStepChange(Math.max(currentStep - 1, 0));
      else if (cmd.includes('repeat') || cmd.includes('read step'))
        readCurrentStep();
    },
  });

  // Need useState — import it at top of file
  const readCurrentStep = () => {
    if (!steps[currentStep]) return;
    setSpeaking(true);
    speak(steps[currentStep], {
      rate: 0.9,
    });
    // Estimate duration
    const wordCount = steps[currentStep].split(' ').length;
    setTimeout(() => setSpeaking(false), (wordCount / 2.5) * 1000);
  };

  if (!supported) return null;

  return (
    <div className="voice-step-nav">
      <button
        className={`vsn-btn ${listening ? 'vsn-btn--active' : ''}`}
        onClick={listening ? stopListening : startListening}
        title="Voice control (say: next step, previous, repeat)"
      >
        {listening ? <MicOff size={16} /> : <Mic size={16} />}
        {listening ? 'Listening…' : 'Voice Control'}
      </button>

      <button
        className={`vsn-btn ${speaking ? 'vsn-btn--speaking' : ''}`}
        onClick={speaking ? (() => { stopSpeaking(); setSpeaking(false); }) : readCurrentStep}
        title="Read step aloud"
      >
        {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
        {speaking ? 'Stop' : 'Read Step'}
      </button>
    </div>
  );
}