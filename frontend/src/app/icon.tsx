import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 45%, #0ea5e9 100%)',
          color: 'white',
          display: 'flex',
          fontSize: 176,
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
