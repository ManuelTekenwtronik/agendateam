// Función de STREAMING (Netlify v2): reenvía la respuesta de Anthropic en tiempo real (SSE).
// Mantiene la conexión activa para evitar el "Inactivity Timeout" de proxies en respuestas largas.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: cors });
  }
  try {
    const body = await req.json();
    body.stream = true; // pedir streaming a Anthropic
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });
    // Reenviar el cuerpo (ReadableStream) tal cual al cliente como text/event-stream.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...cors,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache"
      }
    });
  } catch (e) {
    return new Response("error: " + e.message, { status: 500, headers: cors });
  }
};
