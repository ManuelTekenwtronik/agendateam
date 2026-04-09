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

    const url = appUrl || 'https://agendateam.netlify.app';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f7;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#1a1d2e;padding:28px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">📋</div>
      <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">AgendaTeam</div>
      <div style="color:#8899bb;font-size:13px;margin-top:6px;">Gestión de tareas del equipo</div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:16px;color:#1a1d2e;font-weight:700;">Hola, ${name} 👋</p>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7;">
        Tu cuenta en <b>AgendaTeam</b> ha sido creada. Esta plataforma te permite
        <b>recibir y gestionar tus tareas diarias</b> asignadas por tu supervisor,
        reportar el cumplimiento con evidencia fotográfica y recibir retroalimentación
        en tiempo real.
      </p>

      <!-- Credenciales -->
      <div style="background:#f4f6fb;border:1.5px solid #e0e4f0;border-radius:14px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Tus datos de acceso</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr>
            <td style="color:#999;padding-bottom:10px;">Nombre</td>
            <td style="color:#1a1d2e;font-weight:700;text-align:right;padding-bottom:10px;">${name}</td>
          </tr>
          <tr>
            <td style="color:#999;padding-bottom:10px;border-top:1px solid #eee;padding-top:10px;">Cargo</td>
            <td style="color:#1a1d2e;font-weight:700;text-align:right;border-top:1px solid #eee;padding-top:10px;">${role || '—'}</td>
          </tr>
          <tr>
            <td style="color:#999;border-top:1px solid #eee;padding-top:10px;">PIN de acceso</td>
            <td style="text-align:right;border-top:1px solid #eee;padding-top:10px;">
              <span style="font-size:26px;font-weight:800;color:#1a1d2e;letter-spacing:6px;">${pin}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Botón -->
      <a href="${url}" style="display:block;background:#1a1d2e;color:#fff;text-align:center;padding:15px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:22px;">
        🚀 Ingresar a AgendaTeam
      </a>

      <!-- Instrucciones -->
      <div style="background:#f0fff8;border:1.5px solid #b8f0d8;border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#1a7a4a;margin-bottom:8px;">📌 Cómo ingresar</div>
        <ol style="margin:0;padding-left:18px;font-size:13px;color:#555;line-height:2;">
          <li>Abre el enlace de AgendaTeam</li>
          <li>Toca <b>"Colaboradores"</b> y selecciona tu nombre</li>
          <li>Ingresa tu PIN: <b style="color:#1a1d2e;letter-spacing:3px;">${pin}</b></li>
          <li>Revisa tus tareas asignadas y repórtalas al completarlas</li>
        </ol>
      </div>

      <!-- Qué es AgendaTeam -->
      <div style="background:#f8f9ff;border:1.5px solid #e0e4f0;border-radius:12px;padding:16px;">
        <div style="font-size:12px;font-weight:700;color:#3a4a8a;margin-bottom:8px;">ℹ️ ¿Qué es AgendaTeam?</div>
        <p style="margin:0;font-size:13px;color:#666;line-height:1.7;">
          AgendaTeam es una herramienta de seguimiento de tareas diarias. Tu supervisor
          te asignará tareas con criterios específicos de cumplimiento. Al completarlas,
          deberás reportarlas con una descripción y evidencia fotográfica. La plataforma
          valida automáticamente el cumplimiento y notifica a tu supervisor.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f4f6fb;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;font-size:12px;color:#aaa;">
        Enviado por <b>${fromName || 'AgendaTeam'}</b> · Guarda tu PIN en un lugar seguro.<br>
        Si tienes dudas, contacta a tu supervisor.
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
        subject: "📋 Bienvenido/a a AgendaTeam — Tus datos de acceso",
        html: html
      })
    });

    const data = await res.json();
    console.log("Resend response:", JSON.stringify(data));

    if (data.id) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id: data.id }) };
    } else {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: data.message || JSON.stringify(data) }) };
    }
  } catch (e) {
    console.error("sendmail error:", e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
