// Generic inbound lead endpoint for websites, Google Forms, Make, Zapier and n8n.
export async function onRequestPost({ request, env }) {
  try {
    if (!env.GAS_URL || !env.CRM_PROXY_SECRET) return json({ ok: false, error: 'CRM backend is not configured.' }, 503);
    const raw = await request.text();
    if (raw.length > 100000) return json({ ok: false, error: 'Payload is too large (100 KB maximum).' }, 413);
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json({ ok: false, error: 'Send a JSON object.' }, 400);
    const integrationKey = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const eventId = request.headers.get('Idempotency-Key') || payload.eventId || payload.id || '';
    const upstream = await fetch(env.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'inboundWebhook', proxySecret: env.CRM_PROXY_SECRET, integrationKey, eventId, lead: payload.lead || payload }) });
    const text = await upstream.text();
    let result; try { result = JSON.parse(text); } catch { result = null; }
    const status = result?.ok === true ? upstream.status : (String(result?.error || '').includes('Invalid integration key') ? 401 : 400);
    return new Response(text, { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (err) { return json({ ok: false, error: err.message || 'Inbound webhook failed.' }, 400); }
}
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
