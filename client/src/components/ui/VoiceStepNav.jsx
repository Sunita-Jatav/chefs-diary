import { useEffect,useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import UseAuthStore  from '../../store/useAuthStore';

export function VoiceStepNav({ steps, currentStep, onStepChange }) {
  const { user } = UseAuthStore();
  const [speaking, setSpeaking] = useState(false);

  const { listening, supported, startListening, stopListening, speak, stopSpeaking } = useVoice({
    username: user?.username,
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
    <div style={{
      position: 'sticky',
      top: '5rem',
      zIndex: 40,
      background: listening ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${listening ? 'rgba(193,97,79,0.4)' : 'rgba(44,31,14,0.15)'}`,
      boxShadow: listening ? '0 12px 40px rgba(193,97,79,0.15)' : '0 4px 20px rgba(44,31,14,0.05)',
      borderRadius: '1rem',
      padding: '1rem',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      justifyContent: 'space-between',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
          background: listening ? 'var(--color-terracotta)' : 'white',
          color: listening ? 'white' : 'var(--color-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(44,31,14,0.05)',
          border: '1px solid rgba(44,31,14,0.1)',
        }}>
          {listening ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ink)' }}>
            Hands-Free Cooking
          </h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            Say: "next step", "previous", or "read step"
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={listening ? stopListening : startListening}
          style={{
            padding: '0.4rem 0.8rem', borderRadius: '0.5rem',
            border: 'none', background: listening ? 'rgba(193,97,79,0.1)' : 'white',
            color: listening ? 'var(--color-terracotta)' : 'var(--color-ink)',
            border: '1px solid', borderColor: listening ? 'var(--color-terracotta)' : 'rgba(44,31,14,0.15)',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}
        >
          {listening ? 'Stop Listening' : 'Enable Voice'}
        </button>

        <button
          onClick={speaking ? (() => { stopSpeaking(); setSpeaking(false); }) : readCurrentStep}
          style={{
            padding: '0.4rem 0.8rem', borderRadius: '0.5rem',
            border: 'none', background: speaking ? 'rgba(44,31,14,0.1)' : 'white',
            color: 'var(--color-ink)',
            border: '1px solid rgba(44,31,14,0.15)',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}
        >
          {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {speaking ? 'Stop Reading' : 'Read Aloud'}
        </button>
      </div>
    </div>
  );
}