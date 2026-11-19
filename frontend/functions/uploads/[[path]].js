export async function onRequest(context) {
  const { request, params } = context;
  const subPathArray = params.path || [];
  const subPath = Array.isArray(subPathArray) ? subPathArray.join('/') : subPathArray;

  const url = new URL(request.url);
  const targetUrl = `http://121.241.29.115:5050/uploads/${subPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
    });
    return response;
  } catch (err) {
    return new Response('Asset not found', { status: 404 });
  }
}
