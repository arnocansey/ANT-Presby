'use client';

import React from 'react';
import QRCode from 'qrcode';

// A QR code drawn as inline SVG. The text is our own card code and the library only outputs path markup.
export default function QrCode({ text, size = 160, label }: { text: string; size?: number; label: string }) {
  const [svg, setSvg] = React.useState('');

  React.useEffect(() => {
    let active = true;
    QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })
      .then((markup) => active && setSvg(markup))
      .catch(() => active && setSvg(''));
    return () => {
      active = false;
    };
  }, [text]);

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className="rounded-md bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
