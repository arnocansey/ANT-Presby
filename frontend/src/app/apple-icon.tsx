import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#ffffff',
          border: '12px solid #e0f2fe',
          borderRadius: 36,
          color: '#0369a1',
          display: 'flex',
          fontSize: 64,
          fontWeight: 800,
          height: '100%',
          justifyContent: 'center',
          letterSpacing: '-0.08em',
          width: '100%',
        }}
      >
        AP
      </div>
    ),
    size,
  );
}
