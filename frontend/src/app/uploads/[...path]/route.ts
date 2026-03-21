import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const buildUploadTargetUrl = (path: string[]) => {
  const backendOrigin = BACKEND_API_URL.replace(/\/api\/?$/, '');
  return `${backendOrigin}/uploads/${path.join('/')}`;
};

const forwardUpload = async (request: NextRequest, path: string[]) => {
  try {
    const targetUrl = buildUploadTargetUrl(path);
    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        accept: request.headers.get('accept') || '*/*',
      },
    });

    const responseHeaders = new Headers();

    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'content-encoding' || lowerKey === 'content-length') {
        return;
      }

      responseHeaders.set(key, value);
    });

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
