const { allowMethods, handleCors, handleError, jsonResponse } = require("./_lib/http");
const { getDatabase } = require("./_lib/mongo");

module.exports = async function handler(request, response) {
  try {
    if (handleCors(request, response, ["GET"])) return;
  } catch (error) {
    return handleError(response, error, "No se pudo verificar la conexión con MongoDB.");
  }

  if (request.method !== "GET") {
    return allowMethods(response, ["GET"]);
  }

  try {
    await (await getDatabase()).command({ ping: 1 });
    return jsonResponse(response, 200, {
      status: "ok",
      database: "connected",
      service: "programstyle-vercel-api"
    });
  } catch (error) {
    return handleError(response, error, "No se pudo verificar la conexión con MongoDB.");
  }
};
