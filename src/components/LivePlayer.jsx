import React, { useEffect, useRef, useState } from 'react';

export default function LivePlayer({ stream, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState('');
// Detect URL type at top of component (after the useEffect)
const isIframe = stream?.url && (
  stream.url.includes('youtube.com') ||
  stream.url.includes('youtu.be') ||
  stream.url.includes('twitch.tv') ||
  stream.url.includes('/embed') ||
  stream.url.startsWith('https://') && !stream.url.includes('.m3u8')
);

  useEffect(() => {
    if (!stream?.url || !videoRef.current) return;
    const video = videoRef.current;

    function loadHls() {
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(stream.url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) setError('Stream unavailable or blocked.');
        });
        hlsRef.current = hls;
        video.play().catch(() => {});
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream.url;
        video.play().catch(() => {});
      } else {
        setError('HLS not supported in this browser.');
      }
    }

    if (window.Hls) {
      loadHls();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      script.onload = loadHls;
      script.onerror = () => setError('Failed to load player library.');
      document.body.appendChild(script);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.stopLoad();
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        style={{ width: '100%', maxWidth: 960, borderRadius: 14, overflow: 'hidden', background: '#000' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#0a1628' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8f4ff' }}>🔴 {stream.title}</div>
            {stream.time && <div style={{ fontSize: 12, color: 'rgba(232,244,255,0.5)' }}>{stream.time}</div>}
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
<div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }}>
  {isIframe ? (
    <iframe
      src={stream.url}
      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      allowFullScreen
      allow="autoplay; fullscreen; encrypted-media"
      scrolling="no"
    />
  ) : (
    <>
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, background: 'rgba(0,0,0,0.7)', textAlign: 'center', padding: 20,
        }}>
          {error}
        </div>
      )}
    </>
  )}
</div> 
      </div>
    </div>
  );
}