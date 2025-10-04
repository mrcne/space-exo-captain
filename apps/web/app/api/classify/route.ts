export const dynamic = 'force-static'

import { NextResponse } from "next/server";

const MODEL_API_CLASSIFY = process.env.MODEL_API_CLASSIFY ?? 'https://dummyjson.com/test';

export async function POST(request: Request) {
  try {
    return await forward(request);
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error'

    return new Response(message, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    return await forward(request);
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error'

    return new Response(message, { status: 500 })
  }
}

async function forward(request: Request) {
  try {
    const body = await request.arrayBuffer();
    const init: RequestInit = {
      method: request.method,
      headers: filterForwardHeaders(request.headers),
      body: body.byteLength ? body : undefined,
    };

    const upstream = await fetch(MODEL_API_CLASSIFY, init);

    const upstreamBody = upstream.body ?? (await upstream.arrayBuffer());

    // excluding hop-by-hop headers
    const resHeaders = new Headers(upstream.headers);
    stripHopByHopHeaders(resHeaders);
    // ensure body/headers consistency to avoid decoding errors
    resHeaders.delete('content-encoding');
    resHeaders.delete('content-length');
    resHeaders.delete('content-range');

    return new NextResponse(upstreamBody, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Upstream proxy error', details: String(err) }, { status: 502 });
  }
}

function filterForwardHeaders(incoming: Headers) {
  const headers = new Headers();
  // forward only safe/required headers
  const allowed = ['authorization', 'content-type', 'accept', 'user-agent', 'cookie'];
  for (const name of allowed) {
    const v = incoming.get(name);
    if (v) headers.set(name, v);
  }
  // prevent upstream from sending compressed payloads to avoid decode mismatch
  headers.set('accept-encoding', 'identity');
  return headers;
}

function stripHopByHopHeaders(h: Headers) {
  const hopByHop = [
    'connection','keep-alive','proxy-authenticate','proxy-authorization',
    'te','trailers','transfer-encoding','upgrade'
  ];
  for (const k of hopByHop) h.delete(k);
}
