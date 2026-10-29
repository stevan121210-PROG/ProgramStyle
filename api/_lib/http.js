class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(response, status, body) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(body);
}

function allowMethods(response, methods) {
  response.setHeader("Allow", methods.join(", "));
  return jsonResponse(response, 405, { error: "Método no permitido." });
}

function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Array.isArray(request.body)) {
    return request.body;
  }
  if (typeof request.body === "string") {
    try {
      const body = JSON.parse(request.body);
      return body && typeof body === "object" && !Array.isArray(body) ? body : null;
    } catch {
      return null;
    }
  }
  return null;
}

function handleCors(request, response, methods) {
  const origin = request.headers.origin;
  if (origin) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!allowedOrigins.includes(origin)) {
      throw new HttpError(403, "Este origen no está autorizado.");
    }

    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Headers", "authorization, content-type, accept");
    response.setHeader("Access-Control-Allow-Methods", [...methods, "OPTIONS"].join(", "));
    response.setHeader("Access-Control-Max-Age", "86400");
    response.setHeader("Vary", "Origin");
  }

  if (request.method === "OPTIONS") {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Allow", [...methods, "OPTIONS"].join(", "));
    response.status(204).end();
    return true;
  }

  return false;
}

function handleError(response, error, fallbackMessage) {
  if (error instanceof HttpError) {
    return jsonResponse(response, error.status, { error: error.message });
  }
  console.error(fallbackMessage, error);
  return jsonResponse(response, 500, { error: fallbackMessage });
}

module.exports = { HttpError, allowMethods, handleCors, handleError, jsonResponse, readJsonBody };
