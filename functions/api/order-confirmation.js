// Cloudflare Pages Function — POST /api/order-confirmation
// Envía el correo de confirmación al cliente vía Resend, desde el dominio propio
// (pedidos@fitfuelgt.com). La API key vive como secreto de Pages
// (context.env.RESEND_API_KEY) y NUNCA llega al navegador. El HTML se arma aquí
// (no se acepta HTML del cliente) y se valida el Origin para no ser un relay de spam.

const ALLOWED_HOSTS = ["fitfuelgt.com", "www.fitfuelgt.com"];
const FROM = "FITFUEL <pedidos@fitfuelgt.com>";
const REPLY_TO = "contacto@fitfuelgt.com";

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

// Acepta la petición solo si el Origin/Referer es de nuestro sitio. Si no llega
// ninguno de los dos, se rechaza (bloquea curl/bots; los navegadores sí los mandan
// en un POST del mismo origen).
function originAllowed(request) {
  const hostOf = (val) => {
    if (!val) return null;
    try { return new URL(val).hostname; } catch { return null; }
  };
  const ok = (h) => h != null && (ALLOWED_HOSTS.includes(h) || h.endsWith(".pages.dev"));
  const origin = hostOf(request.headers.get("Origin"));
  if (origin != null) return ok(origin);
  const referer = hostOf(request.headers.get("Referer"));
  if (referer != null) return ok(referer);
  return false;
}

function buildHtml(d) {
  const { nombre, id, date, items = [], subtotal = 0, shipping = 0, total = 0,
          direccion, municipio, departamento, telefono, pago } = d;
  const accent = "#2E7D5B";
  const rows = items.map((it) => {
    const line = esc(it.name) + (it.flavor ? ` <span style="color:#8C877C">(${esc(it.flavor)})</span>` : "");
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #ECEAE3;font:14px/1.4 Arial,sans-serif;color:#16130F"><span style="display:inline-block;min-width:26px;color:#8C877C;font-weight:700">${it.qty}×</span> ${line}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ECEAE3;font:14px/1.4 Arial,sans-serif;color:#16130F;text-align:right;white-space:nowrap">Q${(it.price * it.qty).toFixed(2)}</td>
    </tr>`;
  }).join("");
  const totalRow = (label, val, strong) => `<tr>
    <td style="padding:${strong ? "12px 0 0" : "4px 0"};font:${strong ? "700 16px" : "14px"}/1.5 Arial,sans-serif;color:${strong ? "#16130F" : "#5B564C"}">${label}</td>
    <td style="padding:${strong ? "12px 0 0" : "4px 0"};font:${strong ? "700 16px" : "14px"}/1.5 Arial,sans-serif;color:#16130F;text-align:right;white-space:nowrap">${val}</td>
  </tr>`;
  const totals =
    totalRow("Subtotal", `Q${Number(subtotal).toFixed(2)}`) +
    totalRow("Envío", Number(shipping) === 0 ? "Gratis" : `Q${Number(shipping).toFixed(2)}`) +
    totalRow("Total", `Q${Number(total).toFixed(2)}`, true);
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F2EC">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">¡Gracias por tu compra! — Pedido #${esc(id)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2EC;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(20,19,15,.08)">
        <tr><td style="background:#16130F;padding:22px 24px;text-align:center">
          <span style="font:800 22px Arial,sans-serif;letter-spacing:4px;color:#EAE7DF">FITFUEL</span>
        </td></tr>
        <tr><td style="background:${accent};padding:22px 24px;text-align:center">
          <div style="font:800 20px Arial,sans-serif;color:#FFFFFF">✅ ¡Gracias por tu compra!</div>
          <div style="font:14px Arial,sans-serif;color:rgba(255,255,255,.85);margin-top:4px">Recibimos tu pedido correctamente</div>
        </td></tr>
        <tr><td style="padding:24px 24px 0">
          <div style="font:700 18px Arial,sans-serif;color:#16130F;margin-bottom:6px">Hola ${esc(nombre)}</div>
          <div style="font:15px/1.6 Arial,sans-serif;color:#5B564C">Estamos preparando tu pedido. Te avisaremos por correo cuando cambie de estado.</div>
        </td></tr>
        <tr><td style="padding:20px 24px 0">
          <div style="font:700 12px Arial,sans-serif;letter-spacing:1px;color:#8C877C;text-transform:uppercase;margin-bottom:2px">Pedido</div>
          <div style="font:800 16px Arial,sans-serif;color:${accent}">#${esc(id)}</div>
          ${date ? `<div style="font:13px Arial,sans-serif;color:#A7A296;margin-top:2px">${esc(date)}</div>` : ""}
        </td></tr>
        <tr><td style="padding:12px 24px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="padding:10px 24px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totals}</table>
        </td></tr>
        <tr><td style="padding:18px 24px 0">
          <div style="font:700 12px Arial,sans-serif;letter-spacing:1px;color:#8C877C;text-transform:uppercase;margin-bottom:6px">Entrega</div>
          <div style="font:14px/1.5 Arial,sans-serif;color:#16130F">${esc(direccion)}, ${esc(municipio)}, ${esc(departamento)}<br>Tel: ${esc(telefono)}<br>Pago: ${esc(pago)}</div>
        </td></tr>
        <tr><td style="padding:26px 24px">
          <div style="border-top:1px solid #ECEAE3;padding-top:16px;text-align:center">
            <div style="font:700 13px Arial,sans-serif;letter-spacing:3px;color:#16130F">FITFUEL</div>
            <div style="font:12px/1.5 Arial,sans-serif;color:#A7A296;margin-top:4px">Suplementos para tu mejor versión · Guatemala</div>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!originAllowed(request)) return json({ ok: false, error: "forbidden_origin" }, 403);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: "email_not_configured" }, 503);

  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }

  const correo = String((d && d.correo) || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return json({ ok: false, error: "bad_email" }, 400);

  const subject = `✅ ¡Gracias por tu compra! Pedido #${d.id}`;
  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [correo], reply_to: REPLY_TO, subject, html: buildHtml(d) }),
    });
  } catch (e) {
    return json({ ok: false, error: "network", detail: String(e).slice(0, 200) }, 502);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return json({ ok: false, error: "resend_failed", detail: txt.slice(0, 300) }, 502);
  }
  const out = await res.json().catch(() => ({}));
  return json({ ok: true, id: out.id || null });
}
