import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const buildTargetUrl = (request: NextRequest, path: string[]) => {
  const normalizedBase = BACKEND_API_URL.replace(/\/$/, '');
  const target = new URL(`${normalizedBase}/${path.join('/')}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return target;
};

const copyHeaders = (request: NextRequest) => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey === 'host' ||
      lowerKey === 'connection' ||
      lowerKey === 'content-length' ||
      lowerKey === 'x-forwarded-host' ||
      lowerKey === 'origin'
    ) {
      return;
    }

    headers.set(key, value);
  });

  return headers;
};

const getSetCookieHeaders = (headers: Headers) => {
  const maybeHeaders = headers as Headers & { getSetCookie?: () => string[] };

  if (typeof maybeHeaders.getSetCookie === 'function') {
    return maybeHeaders.getSetCookie().filter(Boolean);
  }

  const setCookie = headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
};

const proxyRequest = async (request: NextRequest, path: string[]) => {
  try {
    const targetUrl = buildTargetUrl(request, path);
    const headers = copyHeaders(request);
    const requestBody =
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer();

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: requestBody,
      redirect: 'manual',
    });

    const responseHeaders = new Headers();

    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();

      if (lowerKey === 'content-encoding' || lowerKey === 'content-length' || lowerKey === 'set-cookie') {
        return;
      }

      responseHeaders.append(key, value);
    });

    for (const setCookie of getSetCookieHeaders(backendResponse.headers)) {
      responseHeaders.append('set-cookie', setCookie);
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown proxy error';

    return NextResponse.json(
      {
        success: false,
        error: 'Proxy request failed',
        details,
      },
      { status: 502 }
    );
  }
};

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
