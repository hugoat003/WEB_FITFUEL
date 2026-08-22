// Cloudflare Pages Function — POST /api/order-confirmation
//
// Único punto de salida de correo al cliente. Envía dos tipos, ambos vía Resend desde el
// dominio propio (pedidos@fitfuelgt.com), con la API key como secreto de Pages
// (context.env.RESEND_API_KEY) que NUNCA llega al navegador:
//
//   type: "confirmation"  → "¡Gracias por tu compra!" al confirmar el pedido (lo manda la tienda)
//   type: "status"        → "Tu pedido va en camino", etc. (lo manda el panel al cambiar el estado)
//
// Antes el correo de estado salía por EmailJS desde admin.html, con su plantilla y su clave
// pública en el HTML. Eso significaba dos proveedores, dos diseños que mantener y un límite
// de 200 correos al mes. Ahora hay uno solo: mismo remitente, mismo diseño, 3.000/mes.
//
// El HTML se arma AQUÍ (nunca se acepta HTML del cliente) y se valida el Origin para no
// convertirse en un relay de spam.
//
// PENDIENTE (mejora futura): el tipo "status" debería exigir además el token de sesión del
// admin y verificar profiles.is_admin contra Supabase. Hoy solo lo protege el Origin, igual
// que el correo de confirmación.

const ALLOWED_HOSTS = ["fitfuelgt.com", "www.fitfuelgt.com"];
const FROM = "FITFUEL <pedidos@fitfuelgt.com>";
const REPLY_TO = "contacto@fitfuelgt.com";

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const q = (n) => "Q" + Number(n || 0).toFixed(2);

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

// Acepta la petición solo si el Origin/Referer es de nuestro sitio. Si no llega ninguno de
// los dos, se rechaza (bloquea curl/bots; los navegadores sí los mandan en un POST).
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

/* ── Estados ─────────────────────────────────────────────────────────────── */
const STATUS = {
  confirmado: { label: "Confirmado", emoji: "✅", color: "#2E7D5B",
    msg: "Tu pedido fue confirmado y lo estamos preparando. 💪",
    subject: (id) => `✅ Tu pedido #${id} fue confirmado` },
  enviado: { label: "Enviado", emoji: "🚚", color: "#2F6FB0",
    msg: "Tu pedido va en camino. 🚚",
    subject: (id) => `🚚 Tu pedido #${id} va en camino` },
  entregado: { label: "Entregado", emoji: "📦", color: "#1F8A70",
    msg: "Tu pedido fue entregado. ¡Gracias por tu compra!",
    subject: (id) => `📦 Tu pedido #${id} fue entregado` },
  cancelado: { label: "Cancelado", emoji: "✖️", color: "#C0392B",
    msg: "Tu pedido fue cancelado. Si tienes dudas, escríbenos.",
    subject: (id) => `Tu pedido #${id} fue cancelado` },
};

/* ── Plantilla compartida ────────────────────────────────────────────────── */
function itemRows(items) {
  return (items || []).map((it) => {
    const line = esc(it.name) + (it.flavor ? ` <span style="color:#8C877C">(${esc(it.flavor)})</span>` : "");
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #ECEAE3;font:14px/1.4 Arial,sans-serif;color:#16130F"><span style="display:inline-block;min-width:26px;color:#8C877C;font-weight:700">${Number(it.qty) || 0}×</span> ${line}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ECEAE3;font:14px/1.4 Arial,sans-serif;color:#16130F;text-align:right;white-space:nowrap">${q((it.price || 0) * (it.qty || 0))}</td>
    </tr>`;
  }).join("");
}

function totalRow(label, val, strong) {
  const pad = strong ? "12px 0 0" : "4px 0";
  const font = strong ? "700 16px" : "14px";
  return `<tr>
    <td style="padding:${pad};font:${font}/1.5 Arial,sans-serif;color:${strong ? "#16130F" : "#5B564C"}">${label}</td>
    <td style="padding:${pad};font:${font}/1.5 Arial,sans-serif;color:#16130F;text-align:right;white-space:nowrap">${val}</td>
  </tr>`;
}

// Un único esqueleto para los dos correos: cabecera FITFUEL, banner de color, saludo,
// resumen del pedido, entrega y pie. Lo que cambia entre uno y otro es el color, el titular
// y el texto de entrada.
function emailShell({ accent, banner, emoji, greeting, intro, order, date, footerNote }) {
  const o = order || {};
  const shipping = Number(o.shipping) || 0;
  const totals =
    (o.subtotal != null ? totalRow("Subtotal", q(o.subtotal)) : "") +
    totalRow("Envío", shipping === 0 ? "Gratis" : q(shipping)) +
    (o.discount_code ? totalRow(`Descuento (${esc(o.discount_code)})`, "—") : "") +
    (o.total != null ? totalRow("Total", q(o.total), true) : "");

  const entrega = o.direccion
    ? `<tr><td style="padding:18px 24px 0">
         <div style="font:700 12px Arial,sans-serif;letter-spacing:1px;color:#8C877C;text-transform:uppercase;margin-bottom:6px">Entrega</div>
         <div style="font:14px/1.5 Arial,sans-serif;color:#16130F">${esc(o.direccion)}${o.municipio ? ", " + esc(o.municipio) : ""}${o.departamento ? ", " + esc(o.departamento) : ""}${o.telefono ? "<br>Tel: " + esc(o.telefono) : ""}${o.pago ? "<br>Pago: " + esc(o.pago) : ""}</div>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F2EC">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(banner)} — Pedido #${esc(o.id)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2EC;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(20,19,15,.08)">
        <tr><td style="background:#16130F;padding:22px 24px;text-align:center">
          <span style="font:800 22px Arial,sans-serif;letter-spacing:4px;color:#EAE7DF">FITFUEL</span>
        </td></tr>
        <tr><td style="background:${accent};padding:22px 24px;text-align:center">
          <div style="font:800 20px Arial,sans-serif;color:#FFFFFF">${emoji ? emoji + " " : ""}${esc(banner)}</div>
          ${intro ? `<div style="font:14px Arial,sans-serif;color:rgba(255,255,255,.85);margin-top:4px">${esc(intro)}</div>` : ""}
        </td></tr>
        <tr><td style="padding:24px 24px 0">
          <div style="font:700 18px Arial,sans-serif;color:#16130F;margin-bottom:6px">${esc(greeting)}</div>
        </td></tr>
        <tr><td style="padding:12px 24px 0">
          <div style="font:700 12px Arial,sans-serif;letter-spacing:1px;color:#8C877C;text-transform:uppercase;margin-bottom:2px">Pedido</div>
          <div style="font:800 16px Arial,sans-serif;color:${accent}">#${esc(o.id)}</div>
          ${date ? `<div style="font:13px Arial,sans-serif;color:#A7A296;margin-top:2px">${esc(date)}</div>` : ""}
        </td></tr>
        <tr><td style="padding:12px 24px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(o.items)}</table>
        </td></tr>
        <tr><td style="padding:10px 24px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totals}</table>
        </td></tr>
        ${entrega}
        <tr><td style="padding:26px 24px">
          ${footerNote ? `<div style="font:13px/1.6 Arial,sans-serif;color:#8C877C;text-align:center;margin-bottom:14px">${esc(footerNote)}</div>` : ""}
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

/* ── Petición ────────────────────────────────────────────────────────────── */
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!originAllowed(request)) return json({ ok: false, error: "forbidden_origin" }, 403);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: "email_not_configured" }, 503);

  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }

  const correo = String((d && d.correo) || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return json({ ok: false, error: "bad_email" }, 400);

  const nombre = d.nombre || "Cliente";
  let subject, html;

  if (d.type === "status") {
    const st = STATUS[String(d.status || "").toLowerCase()];
    // "pendiente" no genera aviso: es el estado con el que nace el pedido.
    if (!st) return json({ ok: false, error: "bad_status" }, 400);
    subject = st.subject(d.id);
    html = emailShell({
      accent: st.color, banner: st.label, emoji: st.emoji,
      greeting: `Hola ${nombre}`, intro: st.msg,
      order: d, date: d.date,
      footerNote: "¿Alguna duda con tu pedido? Responde a este correo y te ayudamos.",
    });
  } else {
    subject = `✅ ¡Gracias por tu compra! Pedido #${d.id}`;
    html = emailShell({
      accent: "#2E7D5B", banner: "¡Gracias por tu compra!", emoji: "✅",
      greeting: `Hola ${nombre}`, intro: "Recibimos tu pedido correctamente",
      order: d, date: d.date,
      footerNote: "Estamos preparando tu pedido. Te avisaremos por correo cuando cambie de estado.",
    });
  }

  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [correo], reply_to: REPLY_TO, subject, html }),
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
