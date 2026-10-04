import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const buildUploadTargetUrl = (path: string[]) => {
  const backendOrigin = BACKEND_API_URL.replace(/\/api\/?$/, '');
  return `${backendOrigin}/uploads/${path.map(encodeURIComponent).join('/')}`;
};

// Uploads are served from this site's origin, so anything that isn't a plain raster image is refused
// (an uploaded HTML/JS/SVG file here would run with access to the user's session).
const ALLOWED_UPLOAD_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const isSafePath = (path: string[]) =>
  path.length > 0 && path.every((segment) => segment && segment !== '.' && segment !== '..');

const forwardUpload = async (request: NextRequest, path: string[]) => {
  if (!isSafePath(path)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const targetUrl = buildUploadTargetUrl(path);
    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        accept: request.headers.get('accept') || '*/*',
      },
    });

    const contentType = (backendResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

    if (backendResponse.ok && !ALLOWED_UPLOAD_CONTENT_TYPES.includes(contentType)) {
      return new NextResponse(null, { status: 404 });
    }

    const responseHeaders = new Headers();

    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'content-encoding' || lowerKey === 'content-length' || lowerKey === 'set-cookie') {
        return;
      }

      responseHeaders.set(key, value);
    });

    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; sandbox");

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown upload proxy error';

    return NextResponse.json(
      {
        success: false,
        error: 'Upload proxy request failed',
        details,
      },
      { status: 502 }
    );
  }
};

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forwardUpload(request, path);
}
