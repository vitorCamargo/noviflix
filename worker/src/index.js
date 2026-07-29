const TMDB_ORIGIN = 'https://api.themoviedb.org';
const CACHE_SECONDS = 60 * 30;

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') ?? '';
    const permitted = allowedOrigins(env);
    const isAllowed = permitted.includes(origin);

    if (request.method === 'OPTIONS') {
      return isAllowed
        ? new Response(null, { status: 204, headers: corsHeaders(origin) })
        : json(403, { error: 'Origin not allowed' });
    }

    if (request.method !== 'GET') {
      return json(405, { error: 'Only GET is supported' }, isAllowed ? origin : '');
    }

    if (!isAllowed) {
      return json(403, { error: 'Origin not allowed' });
    }

    if (!env.TMDB_ACCESS_TOKEN) {
      return json(500, { error: 'Proxy is missing TMDB_ACCESS_TOKEN' }, origin);
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/3/')) {
      return json(404, { error: 'Only /3/* TMDB paths are proxied' }, origin);
    }

    const upstream = new URL(TMDB_ORIGIN + url.pathname + url.search);

    const cache = caches.default;
    const cacheKey = new Request(upstream.toString(), { method: 'GET' });

    let response = await cache.match(cacheKey);

    if (!response) {
      const upstreamResponse = await fetch(upstream.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
          Accept: 'application/json',
        },
      });

      response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      response.headers.delete('Set-Cookie');

      if (upstreamResponse.ok) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    } else {
      response = new Response(response.body, response);
    }

    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }

    return response;
  },
};
