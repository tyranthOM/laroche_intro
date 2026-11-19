export async function onRequest(context) {
  const { request, params } = context;
  const subPathArray = params.path || [];
  const subPath = Array.isArray(subPathArray) ? subPathArray.join('/') : subPathArray;

  const url = new URL(request.url);
  const targetUrl = `http://121.241.29.115:5050/socket.io/${subPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  try {
    return await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method.toUpperCase()) ? null : request.body,
    });
  } catch (err) {
    return new Response('Socket connection failed', { status: 502 });
  }
}
