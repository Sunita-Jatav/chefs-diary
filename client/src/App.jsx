// src/App.jsx — Chef's Diary Connection Test
// This file proves the complete Vercel → Render connection works.
// Once confirmed, we will replace this with the real application UI.

import { useState, useEffect } from 'react';

// VITE_API_URL is read from .env.local in development
// and from Vercel's Environment Variables dashboard in production.
// If the variable isn't set, we fall back to localhost for safety.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StatusCard({ status, data, error }) {
  const styles = {
    connected: {
      border:     '1.5px solid #16a34a',
      background: '#f0fdf4',
      color:      '#15803d',
      label:      'Connected',
    },
    error: {
      border:     '1.5px solid #dc2626',
      background: '#fef2f2',
      color:      '#b91c1c',
      label:      'Connection failed',
    },
    checking: {
      border:     '1.5px solid #d97706',
      background: '#fffbeb',
      color:      '#b45309',
      label:      'Checking...',
    },
  };

  const s = styles[status] || styles.checking;

  return (
    <div style={{
      border:       s.border,
      background:   s.background,
      borderRadius: '10px',
      padding:      '24px',
      marginTop:    '24px',
    }}>
      <p style={{ margin: '0 0 8px', fontWeight: 500, color: s.color }}>
        Status: {s.label}
      </p>
      {data && (
        <>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#374151' }}>
            <span style={{ fontWeight: 500 }}>Message:</span> {data.message}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#374151' }}>
            <span style={{ fontWeight: 500 }}>Environment:</span> {data.environment}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#374151' }}>
            <span style={{ fontWeight: 500 }}>Server uptime:</span> {data.uptime}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#374151' }}>
            <span style={{ fontWeight: 500 }}>Timestamp:</span> {data.timestamp}
          </p>
        </>
      )}
      {error && (
        <p style={{ margin: '4px 0', fontSize: '14px', color: '#b91c1c' }}>
          <span style={{ fontWeight: 500 }}>Error:</span> {error}
        </p>
      )}
    </div>
  );
}

function App() {
  const [status, setStatus] = useState('checking');
  const [data,   setData]   = useState(null);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // This fetch() call is the proof of life.
        // In development: hits http://localhost:5000/api/health
        // In production:  hits https://your-service.onrender.com/api/health
        const response = await fetch(`${API_URL}/api/health`);

        if (!response.ok) {
          throw new Error(`Server responded with HTTP status ${response.status}`);
        }

        const json = await response.json();
        setData(json);
        setStatus('connected');

      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    checkConnection();
  }, []); // Empty array = run once when the component first mounts

  return (
    <div style={{
      fontFamily:  'system-ui, sans-serif',
      maxWidth:    '560px',
      margin:      '60px auto',
      padding:     '0 24px',
    }}>
      <h1 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px' }}>
        Chef's Diary
      </h1>
      <p style={{ color: '#6b7280', margin: '0 0 32px' }}>
        Deployment verification — frontend to backend connection test
      </p>

      <div style={{
        background:   '#f9fafb',
        border:       '1px solid #e5e7eb',
        borderRadius: '10px',
        padding:      '20px',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#6b7280' }}>
          Calling:
        </p>
        <code style={{
          fontSize:   '13px',
          background: '#f3f4f6',
          padding:    '4px 8px',
          borderRadius: '4px',
          wordBreak:  'break-all',
        }}>
          {API_URL}/api/health
        </code>
      </div>

      <StatusCard status={status} data={data} error={error} />

      {status === 'connected' && (
        <p style={{
          marginTop:  '24px',
          fontSize:   '14px',
          color:      '#16a34a',
          fontWeight: 500,
        }}>
          Full-stack pipeline is working. Ready to build Chef's Diary.
        </p>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '20px', fontSize: '13px', color: '#6b7280' }}>
          <p style={{ fontWeight: 500, marginBottom: '6px' }}>Troubleshooting steps:</p>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Is your Express server running? (run <code>npm run dev</code> in the server/ folder)</li>
            <li>Is <code>VITE_API_URL</code> set correctly in <code>client/.env.local</code>?</li>
            <li>Check the browser Console (F12) for more details.</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default App;