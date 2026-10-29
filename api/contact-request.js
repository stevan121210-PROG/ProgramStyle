const { checkRateLimit } = require("./_lib/rate-limit");
const { allowMethods, handleCors, handleError, jsonResponse, readJsonBody } = require("./_lib/http");
const { getDatabase } = require("./_lib/mongo");

function validText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

module.exports = async function handler(request, response) {
  try {
    if (handleCors(request, response, ["POST"])) return;
    if (request.method !== "POST") return allowMethods(response, ["POST"]);
    const body = readJsonBody(request);
    if (!body) return jsonResponse(response, 400, { error: "El cuerpo JSON debe ser un objeto." });
    if (!validText(body.name, 120) || !validText(body.email, 254) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
        !validText(body.message, 5000)) {
      return jsonResponse(response, 400, { error: "Revisa el nombre, el correo y el mensaje; todos son obligatorios." });
    }
    if ((body.phone !== undefined && body.phone !== "" && (typeof body.phone !== "string" || body.phone.length > 40)) ||
        (body.service !== undefined && body.service !== "" && (typeof body.service !== "string" || body.service.length > 120))) {
      return jsonResponse(response, 400, { error: "El teléfono o el servicio supera el tamaño permitido." });
    }
    if (!(await checkRateLimit("contact-request", request, 5, 900))) {
      return jsonResponse(response, 429, { error: "Se alcanzó el límite temporal de solicitudes. Inténtalo más tarde." });
    }

    const database = await getDatabase();
    const createdAt = new Date();
    const result = await database.collection("contact_requests").insertOne({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      service: typeof body.service === "string" ? body.service.trim() || null : null,
      message: body.message.trim(),
      status: "new",
      created_at: createdAt
    });
    return jsonResponse(response, 201, {
      id: result.insertedId.toString(),
      message: "Solicitud recibida."
    });
  } catch (error) {
    return handleError(response, error, "No se pudo registrar la solicitud. Inténtalo de nuevo.");
  }
};
