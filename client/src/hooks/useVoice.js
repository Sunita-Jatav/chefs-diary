import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV_COMMANDS = {
  'go home':        '/',
  'go to home':     '/',
  'open network':   '/network',
  'go to network':  '/network',
  'go to profile':  null, // handled dynamically
  'open settings':  '/settings',
  'go to settings': '/settings',
};

export function useVoice({ onTranscript, onCommand, username } = {}) {
  const navigate = useNavigate();
  const recogRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';

    r.onresult = (e) => {
      const text = e.results[0][0].transcript.trim().toLowerCase();
      // Check nav commands first
      let navHit = false;
      for (const [cmd, path] of Object.entries(NAV_COMMANDS)) {
        if (text.includes(cmd)) {
          const dest = cmd === 'go to profile' ? `/${username}` : path;
          if (dest) navigate(dest);
          navHit = true;
          break;
        }
      }
      // Pass to parent handlers
      if (!navHit) {
        onTranscript?.(text);
      }
      onCommand?.(text); // always fires (step nav uses this)
      setListening(false);
    };

    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    recogRef.current = r;
  }, [navigate, username, onTranscript, onCommand]);

  const startListening = useCallback(() => {
    if (!recogRef.current || listening) return;
    recogRef.current.start();
    setListening(true);
  }, [listening]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text, { rate = 0.95, pitch = 1 } = {}) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = rate;
    utt.pitch = pitch;
    synthRef.current.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { listening, supported, startListening, stopListening, speak, stopSpeaking };
}