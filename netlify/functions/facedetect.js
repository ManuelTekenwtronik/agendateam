exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const { imageUrl } = JSON.parse(event.body);
    if (!imageUrl) return { statusCode: 400, headers, body: JSON.stringify({ error: "imageUrl requerido" }) };

    const apiKey = process.env.FACEPP_API_KEY;
    const apiSecret = process.env.FACEPP_API_SECRET;
    if (!apiKey || !apiSecret) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, reason: "API no configurada" }) };
    }

    const params = new URLSearchParams();
    params.append("api_key", apiKey);
    params.append("api_secret", apiSecret);
    params.append("image_url", imageUrl);
    params.append("return_attributes", "eyestatus,mouthstatus,headpose");

    // Reintento con espera ante límite de concurrencia/cuota de Face++ (picos de la mañana)
    let data;
    for (let i = 0; i < 3; i++) {
      const res = await fetch("https://api-us.faceplusplus.com/facepp/v3/detect", { method: "POST", body: params });
      data = await res.json();
      if (data.error_message && /CONCURRENCY|LIMIT/i.test(data.error_message) && i < 2) {
        await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
        continue;
      }
      break;
    }

    if (data.error_message) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, reason: data.error_message }) };
    }
    const faces = data.faces || [];
    if (!faces.length) return { statusCode: 200, headers, body: JSON.stringify({ faceFound: false }) };

    const att = faces[0].attributes || {};
    function eyeOpen(e) {
      e = e || {};
      const open = (e.no_glass_eye_open || 0) + (e.normal_glass_eye_open || 0);
      const close = (e.no_glass_eye_close || 0) + (e.normal_glass_eye_close || 0);
      return open > close;
    }
    const es = att.eyestatus || {};
    const eyesOpen = eyeOpen(es.left_eye_status) && eyeOpen(es.right_eye_status);
    const m = att.mouthstatus || {};
    const mouthOpen = (m.open || 0) > ((m.close || 0) + (m.surgical_mask_or_respirator || 0) + (m.other_occlusion || 0));

    return { statusCode: 200, headers, body: JSON.stringify({ faceFound: true, eyesOpen, mouthOpen, headpose: att.headpose || null }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message, skipped: true }) };
  }
};
