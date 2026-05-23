// src/components/ui/StreamingText.jsx
// Renders AI-streamed text with a blinking cursor while streaming.
// Used by the story generator and cooking assistant.

export const StreamingText = ({ text, isStreaming, className = '', placeholder = '' }) => {
  if (!text && !isStreaming) {
    return placeholder ? (
      <p className={`text-ink-muted italic ${className}`}>{placeholder}</p>
    ) : null;
  }

  return (
    <p className={`font-body text-ink leading-relaxed whitespace-pre-wrap ${className}`}>
      {text}
      {isStreaming && <span className="streaming-cursor" />}
    </p>
  );
};