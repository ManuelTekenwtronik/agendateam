// Envío de correo genérico vía Resend (asunto + HTML + cc opcional + adjuntos opcionales).
exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: "RESEND_API_KEY no configurada" }) };

    const { to, cc, subject, html, attachments } = JSON.parse(event.body || "{}");
    if (!to || !subject || !html) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Faltan campos (to, subject, html)" }) };
    }

    const payload = {
      from: "AgendaTeam <noreply@tktkcom.com>",
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html
    };
    if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];
    if (attachments && attachments.length) payload.attachments = attachments;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("mail resend:", JSON.stringify(data));
    if (data.id) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: data.id }) };
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: data.message || JSON.stringify(data) }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
