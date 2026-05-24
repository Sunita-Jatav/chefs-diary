import { useState, useCallback, useRef } from 'react';

export const useGroqStream = () => {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming,  setIsStreaming]  = useState(false);
  const [error,        setError]        = useState(null);
  const abortControllerRef             = useRef(null);

  const startStream = useCallback(async (fetchFn) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setStreamedText('');
    setError(null);
    setIsStreaming(true);

    let accumulated = ''; // ← local variable, not affected by stale closure

    try {
      const response = await fetchFn();

      if (!response.ok) throw new Error(`Stream request failed: ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text  = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.error) { setError(json.error); break; }
            if (json.done)  { break; }
            if (json.token) {
              accumulated += json.token;          // ← build locally
              setStreamedText(accumulated);        // ← update display
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Stream failed');
    } finally {
      setIsStreaming(false);
    }

    return accumulated; // ← return the final text to the caller
  }, []);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setStreamedText('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return { streamedText, isStreaming, error, startStream, stopStream, reset };
};