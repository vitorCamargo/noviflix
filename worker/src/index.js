const TMDB_ORIGIN = 'https://api.themoviedb.org';
const CACHE_SECONDS = 60 * 30;

/**
 * The only write this proxy will perform, matched exactly.
 *
 * Holding a credential means every method opened here is a method the whole
 * internet can invoke with our token. Ratings are the one write the app needs, so
 * POST is permitted for this path and nothing else — an anchored pattern with a
 * numeric id, not a prefix test, because a prefix would also accept things like
 * `/3/movie/1/rating/../../account`.
 */
const RATING_PATH = /^\/3\/movie\/\d+\/rating$/;

/** Largest body accepted on a write. A rating is a couple of dozen bytes. */
const MAX_BODY_BYTES = 512;

/**
 * Requests that must never be cached, however cacheable they look.
 *
 * The edge cache is right for catalogue data — a film's details are the same for everyone
 * and change rarely. It is wrong for anything scoped to one visitor's session: the rated
 * list is a GET, so it was being cached for half an hour, and a rating posted a moment
 * later read back as absent because the empty list from before it was still being served.
 *
 * Matched on the path and the query, since the session id appears in either depending on
 * the endpoint.
 */
function isSessionScoped(url) {
  return (
    url.pathname.startsWith('/3/guest_session/') ||
    url.pathname.startsWith('/3/authentication/') ||
    url.searchParams.has('guest_session_id') ||
    url.searchParams.has('session_id')
  );
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

/** True when this exact method and path pair is allowed through. */
function isPermitted(method, pathname) {
  if (!pathname.startsWith('/3/')) return false;
  if (method === 'GET') return true;
  return method === 'POST' && RATING_PATH.test(pathname);
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

    // Origin first, so an unapproved caller learns nothing about what is routable.
    if (!isAllowed) {
      return json(403, { error: 'Origin not allowed' });
    }

    if (!env.TMDB_ACCESS_TOKEN) {
      return json(500, { error: 'Proxy is missing TMDB_ACCESS_TOKEN' }, origin);
    }

    const url = new URL(request.url);

    if (!isPermitted(request.method, url.pathname)) {
      return json(
        405,
        { error: 'Only GET, and POST to a movie rating, are proxied' },
        origin,
      );
    }

    const upstream = new URL(TMDB_ORIGIN + url.pathname + url.search);

    // Client Authorization headers are never forwarded — the token added below is
    // the only credential this proxy will present.
    const headers = {
      Authorization: `Bearer ${env.TMDB_ACCESS_TOKEN}`,
      Accept: 'application/json',
    };

    if (request.method === 'POST') {
      const body = await request.text();

      if (body.length > MAX_BODY_BYTES) {
        return json(413, { error: 'Body too large' }, origin);
      }

      const upstreamResponse = await fetch(upstream.toString(), {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body,
      });

      const response = new Response(upstreamResponse.body, upstreamResponse);
      // Writes are never cached, and must not be stored by anything downstream.
      response.headers.set('Cache-Control', 'no-store');
      response.headers.delete('Set-Cookie');

      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        response.headers.set(key, value);
      }
      return response;
    }

    // Session-scoped reads bypass the cache entirely, in both directions: a stale hit is
    // wrong, and storing one would keep serving it for half an hour.
    if (isSessionScoped(url)) {
      const upstreamResponse = await fetch(upstream.toString(), {
        method: 'GET',
        headers,
      });

      const fresh = new Response(upstreamResponse.body, upstreamResponse);
      fresh.headers.set('Cache-Control', 'no-store');
      fresh.headers.delete('Set-Cookie');

      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        fresh.headers.set(key, value);
      }
      return fresh;
    }

    const cache = caches.default;
    const cacheKey = new Request(upstream.toString(), { method: 'GET' });

    let response = await cache.match(cacheKey);

    if (!response) {
      const upstreamResponse = await fetch(upstream.toString(), {
        method: 'GET',
        headers,
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
