export async function onRequestPost({ request, env }) {
  try {
    if (!env.GAS_URL || !env.CRM_PROXY_SECRET) {
      return json({ ok: false, error: 'CRM backend is not configured. Add GAS_URL and CRM_PROXY_SECRET in Cloudflare Pages environment variables.' }, 503);
    }
    const payload = await request.json();
    const upstream = await fetch(env.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, proxySecret: env.CRM_PROXY_SECRET })
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { ok: false, error: 'Unexpected response from Apps Script. Check deployment and execution logs.' }; }
    return json(data, upstream.ok ? 200 : upstream.status);
  } catch (err) {
    return json({ ok: false, error: err.message || 'Request failed.' }, 400);
  }
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
