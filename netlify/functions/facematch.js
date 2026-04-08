exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const { profileUrl, evidenceUrl } = JSON.parse(event.body);
    if (!profileUrl || !evidenceUrl) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "profileUrl y evidenceUrl requeridos" }) };
    }

    const apiKey = process.env.FACEPP_API_KEY;
    const apiSecret = process.env.FACEPP_API_SECRET;
    if (!apiKey || !apiSecret) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, reason: "API no configurada" }) };
    }

    const params = new URLSearchParams();
    params.append("api_key", apiKey);
    params.append("api_secret", apiSecret);
    params.append("image_url1", profileUrl);
    params.append("image_url2", evidenceUrl);

    const res = await fetch("https://api-us.faceplusplus.com/facepp/v3/compare", {
      method: "POST",
      body: params
    });
    const data = await res.json();

    if (data.error_message) {
      // Cualquier error de API (sin rostro, imagen no descargable, etc.) → omitir, no bloquear
      return { statusCode: 200, headers, body: JSON.stringify({
        skipped: true,
        reason: data.error_message,
        matched: null,
        confidence: 0
      })};
    }

    const confidence = data.confidence || 0;
    // Umbral ajustado a 70 para tolerar variaciones de iluminación/ángulo
    const matched = confidence >= 70;

    return { statusCode: 200, headers, body: JSON.stringify({ matched, confidence, skipped: false }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message, skipped: true }) };
  }
};
