exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const serviceId  = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey  = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, reason: "EmailJS no configurado" }) };
    }

    const { to, name, role, pin, appUrl } = JSON.parse(event.body);
    if (!to || !name || !pin) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Faltan campos requeridos" }) };
    }

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  serviceId,
        template_id: templateId,
        user_id:     publicKey,
        template_params: {
          to_email: to,
          to_name:  name,
          role:     role || "—",
          pin:      pin,
          app_url:  appUrl || "https://agendateam.netlify.app"
        }
      })
    });

    const text = await res.text();
    console.log("EmailJS response:", res.status, text);

    if (res.status === 200) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } else {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: text }) };
    }
  } catch (e) {
    console.error("sendmail error:", e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
