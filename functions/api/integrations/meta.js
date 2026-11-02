// Meta Lead Ads webhook endpoint. Configure the CRM proxy secret in Cloudflare Pages.
export async function onRequestGet({ request, env }) {
  if (!env.GAS_URL || !env.CRM_PROXY_SECRET) return new Response('CRM backend is not configured.', { status: 503 });
  const incoming = new URL(request.url);
  const upstreamUrl = new URL(env.GAS_URL);
  incoming.searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value));
  const upstream = await fetch(upstreamUrl.toString(), { method: 'GET', redirect: 'follow' });
  return new Response(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
export async function onRequestPost({ request, env }) {
  try {
    if (!env.GAS_URL || !env.CRM_PROXY_SECRET) return json({ ok: false, error: 'CRM backend is not configured.' }, 503);
    const rawBody = await request.text();
    const signature = request.headers.get('X-Hub-Signature-256') || '';
    const upstream = await fetch(env.GAS_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'metaWebhook', proxySecret: env.CRM_PROXY_SECRET, rawBody, signature })
    });
    const body = await upstream.text();
    let result; try { result = JSON.parse(body); } catch { result = null; }
    if (!result || result.ok !== true) return new Response(body, { status: result?.error?.includes?.('signature') ? 403 : 500, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    if (Number(result.data?.failed || 0) > 0) return new Response(body, { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    return new Response(body, { status: upstream.status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (err) { return json({ ok: false, error: err.message || 'Webhook delivery failed.' }, 500); }
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
