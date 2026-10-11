'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

const REPEAT_IGNORE_MS = 3000;

// Camera QR scanning in the browser. The scanning library only loads when the camera is opened.
export default function CameraScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [error, setError] = React.useState('');
  const onScanRef = React.useRef(onScan);
  onScanRef.current = onScan;

  React.useEffect(() => {
    let controls: { stop: () => void } | undefined;
    let cancelled = false;
    const last = { text: '', at: 0 };

    import('@zxing/browser')
      .then(async ({ BrowserQRCodeReader }) => {
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (!result) return;
          const text = result.getText();
          const now = Date.now();
          // The camera sees the same card many times a second; act on it once.
          if (text === last.text && now - last.at < REPEAT_IGNORE_MS) return;
          last.text = text;
          last.at = now;
          onScanRef.current(text);
        });
        if (cancelled) controls.stop();
      })
      .catch(() => setError('The camera could not start. Allow camera access, or use the scan box or name search.'));

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        <video
          ref={videoRef}
          className="aspect-video w-full rounded-lg bg-black object-cover"
          muted
          playsInline
          aria-label="Camera view for scanning cards"
        />
      )}
      <Button type="button" variant="secondary" onClick={onClose}>
        Close camera
      </Button>
    </div>
  );
}
