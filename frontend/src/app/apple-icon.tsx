import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

async function getLogoDataUrl() {
  const logoPath = path.join(process.cwd(), '..', 'mobile', 'assets', 'images', 'icon.png');
  const logoBuffer = await readFile(logoPath);

  return `data:image/png;base64,${logoBuffer.toString('base64')}`;
}

export default async function AppleIcon() {
  const logoSrc = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(160deg, #0b1220 0%, #10224a 50%, #173e8a 100%)',
          borderRadius: 36,
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.34) 0%, rgba(245,158,11,0) 70%)',
            height: 150,
            position: 'absolute',
            width: 150,
          }}
        />
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 32,
            display: 'flex',
            height: 116,
            justifyContent: 'center',
            padding: 14,
            width: 116,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="ANT PRESS"
            height="88"
            src={logoSrc}
            style={{ objectFit: 'contain' }}
            width="88"
          />
        </div>
      </div>
    ),
    size,
  );
}
