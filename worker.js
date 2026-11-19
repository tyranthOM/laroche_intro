/**
 * Cloudflare Worker for La Roche Cafe
 * - Serves frontend static assets (React SPA)
 * - Proxies /api/*, /uploads/*, /socket.io/* seamlessly to the cloud backend (Render)
 * - Scheduled cron keep-alive to ensure Render backend never sleeps
 */

const BACKEND_HOST = 'laroche-web.onrender.com';
const BACKEND_ORIGIN = `https://${BACKEND_HOST}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Canonical Redirect: www.larochecafe.in -> larochecafe.in (HTTPS)
    if (url.hostname === 'www.larochecafe.in') {
      url.hostname = 'larochecafe.in';
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // 2. Instant CORS Preflight Handling at the Cloudflare Edge
    if (request.method.toUpperCase() === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 2. High-performance Cloud Backend Proxy for /api/*, /uploads/*, /socket.io/*
    if (
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/uploads') ||
      url.pathname.startsWith('/socket.io')
    ) {
      const targetUrl = new URL(url.pathname + url.search, BACKEND_ORIGIN);

      // WebSocket Upgrade pass-through for Socket.io
      if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
        return fetch(targetUrl.toString(), request);
      }

      // Clone request headers & rewrite Host for Render
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set('Host', BACKEND_HOST);

      const proxyReq = new Request(targetUrl.toString(), {
        method: request.method,
        headers: proxyHeaders,
        body: ['GET', 'HEAD'].includes(request.method.toUpperCase()) ? null : request.body,
        redirect: 'follow',
      });

      try {
        const response = await fetch(proxyReq);
        const respHeaders = new Headers(response.headers);
        respHeaders.set('Access-Control-Allow-Origin', '*');
        respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        respHeaders.set('Access-Control-Allow-Headers', '*');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: respHeaders,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            message: 'Error proxying request to backend server.',
            error: err.message,
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // 3. Fallback: Serve compiled static assets from frontend/dist
    return env.ASSETS.fetch(request);
  },

  // 4. Free 24/7 Keep-Alive Cron: Pings backend every 10 min to prevent cold starts
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      fetch(`${BACKEND_ORIGIN}/api/orders/store-status`).catch((err) =>
        console.warn('Keep-alive ping error:', err?.message)
      )
    );
  },
};
