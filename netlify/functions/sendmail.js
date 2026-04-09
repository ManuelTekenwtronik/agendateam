exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, reason: "RESEND_API_KEY no configurada" }) };
    }

    const { to, name, role, pin, appUrl, fromName } = JSON.parse(event.body);
    if (!to || !name || !pin) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Faltan campos requeridos" }) };
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f7;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#1a1d2e;padding:28px 32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">📋</div>
      <div style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">AgendaTeam</div>
      <div style="color:#aab;font-size:13px;margin-top:4px;">Gestión de tareas del equipo</div>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:15px;color:#555;">Hola, <b style="color:#1a1d2e;">${name}</b> 👋</p>
      <p style="margin:0 0 24px;font-size:14px;color:#777;line-height:1.6;">
        Tu cuenta en <b>AgendaTeam</b> ha sido creada. A continuación encontrarás tus datos de acceso.
      </p>

      <div style="background:#f8f9ff;border:1.5px solid #e5e7ef;border-radius:14px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:12px;color:#999;font-weight:600;text-transform:uppercase;">Nombre</span>
          <span style="font-size:14px;color:#1a1d2e;font-weight:700;">${name}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-top:12px;border-top:1px solid #eee;">
          <span style="font-size:12px;color:#999;font-weight:600;text-transform:uppercase;">Cargo</span>
          <span style="font-size:14px;color:#1a1d2e;font-weight:700;">${role || "—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #eee;">
          <span style="font-size:12px;color:#999;font-weight:600;text-transform:uppercase;">PIN de acceso</span>
          <span style="font-size:22px;color:#1a1d2e;font-weight:800;letter-spacing:4px;">${pin}</span>
        </div>
      </div>

      <a href="${appUrl || 'https://agendateam.netlify.app'}" style="display:block;background:#1a1d2e;color:#fff;text-align:center;padding:14px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:20px;">
        🚀 Ingresar a AgendaTeam
      </a>

      <div style="background:#fff8e8;border:1.5px solid #ffe4a0;border-radius:12px;padding:14px;">
        <div style="font-size:12px;font-weight:700;color:#b8860b;margin-bottom:6px;">📌 Instrucciones de acceso</div>
        <ol style="margin:0;padding-left:18px;font-size:13px;color:#777;line-height:1.8;">
          <li>Abre el enlace de AgendaTeam</li>
          <li>Selecciona tu nombre en la lista</li>
          <li>Ingresa tu PIN: <b style="color:#1a1d2e;letter-spacing:2px;">${pin}</b></li>
          <li>¡Listo! Ya puedes ver tus tareas asignadas</li>
        </ol>
      </div>
    </div>
    <div style="background:#f8f9ff;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;font-size:12px;color:#aaa;">
        Este correo fue enviado por <b>${fromName || 'AgendaTeam'}</b>.<br>
        Guarda tu PIN en un lugar seguro.
      </p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "AgendaTeam <onboarding@resend.dev>",
        to: [to],
        subject: "📋 Tus credenciales de acceso — AgendaTeam",
        html: html
      })
    });

    const data = await res.json();
    if (data.id) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: data.id }) };
    } else {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: data.message || JSON.stringify(data) }) };
    }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
