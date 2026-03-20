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
      lowerKey === 'x-forwarded-host'
    ) {
      return;
    }

    headers.set(key, value);
  });

  return headers;
};

const proxyRequest = async (request: NextRequest, path: string[]) => {
  const targetUrl = buildTargetUrl(request, path);
  const headers = copyHeaders(request);
  const requestBody =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : Buffer.from(await request.arrayBuffer());

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: requestBody,
    redirect: 'manual',
  });

  const responseHeaders = new Headers();

  backendResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-encoding') {
      return;
    }

    responseHeaders.append(key, value);
  });

  const setCookie = backendResponse.headers.get('set-cookie');
  if (setCookie) {
    responseHeaders.append('set-cookie', setCookie);
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
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
