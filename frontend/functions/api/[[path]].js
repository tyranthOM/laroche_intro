export async function onRequest(context) {
  const { request, params } = context;

  // Handle CORS preflight OPTIONS request instantly at the edge
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

  // Extract path segments after /api/
  const subPathArray = params.path || [];
  const subPath = Array.isArray(subPathArray) ? subPathArray.join('/') : subPathArray;

  // Forward request to College Server Express backend via DNS domain
  const url = new URL(request.url);
  const targetUrl = `http://api.larochecafe.in:5050/api/${subPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

  const options = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    options.body = request.body;
  }

  try {
    const response = await fetch(targetUrl, options);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: 'Campus server is currently unreachable. Please check with cafe staff.',
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
