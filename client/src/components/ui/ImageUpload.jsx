// src/components/ui/ImageUpload.jsx
// Reusable drag-and-drop image uploader used in Recipe Editor and Profile.

import { useState, useRef } from 'react';
import { uploadAPI }        from '../../api/upload.api';

export const ImageUpload = ({
  currentUrl,
  uploadType = 'recipeImage', // 'recipeImage' | 'avatar' | 'cover'
  onUploadSuccess,
  aspectLabel = '3:2 recommended',
  placeholder = '🖼️',
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(currentUrl || null);
  const [error,     setError]     = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate type and size client-side first
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    // Show local preview immediately for snappier UX
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setError(null);
    setUploading(true);

    try {
      const data = await uploadAPI[uploadType](file);
      onUploadSuccess?.(data.data.url);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setPreview(currentUrl || null); // Revert preview on failure
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          width: '100%',
          minHeight: '180px',
          borderRadius: '0.75rem',
          border: `2px dashed ${dragging ? 'var(--color-terracotta)' : 'rgba(44,31,14,0.2)'}`,
          background: dragging ? 'rgba(193,97,79,0.04)' : 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Upload preview"
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
            {/* Overlay on hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(44,31,14,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploading ? 1 : 0,
              transition: 'opacity 0.2s',
            }}>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                {uploading ? 'Uploading…' : 'Click to change'}
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{placeholder}</p>
            <p style={{ color: 'var(--color-ink)', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              {uploading ? 'Uploading…' : 'Click or drag to upload'}
            </p>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.75rem' }}>
              JPG, PNG, WebP · Max 5MB · {aspectLabel}
            </p>
          </div>
        )}

        {/* Loading bar */}
        {uploading && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '3px', background: 'rgba(44,31,14,0.1)',
          }}>
            <div style={{
              height: '100%',
              background: 'var(--color-terracotta)',
              animation: 'uploadProgress 1.5s ease-in-out infinite',
              width: '60%',
            }} />
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--color-terracotta)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
};