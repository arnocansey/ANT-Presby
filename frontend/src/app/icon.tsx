import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

async function getLogoDataUrl() {
  const logoPath = path.join(process.cwd(), '..', 'mobile', 'assets', 'images', 'icon.png');
  const logoBuffer = await readFile(logoPath);

  return `data:image/png;base64,${logoBuffer.toString('base64')}`;
}

export default async function Icon() {
  const logoSrc = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #09101f 0%, #0f1c3d 48%, #173e8a 100%)',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.28) 0%, rgba(245,158,11,0) 72%)',
            height: 420,
            position: 'absolute',
            width: 420,
          }}
        />
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 132,
            boxShadow: '0 32px 80px rgba(4, 10, 28, 0.36)',
            display: 'flex',
            height: 264,
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 28,
            width: 264,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="ANT PRESS"
            height="208"
            src={logoSrc}
            style={{ objectFit: 'contain' }}
            width="208"
          />
        </div>
      </div>
    ),
    size,
  );
}
