const { requireSiteAdmin } = require("./_lib/auth");
const { allowMethods, handleCors, handleError, jsonResponse, readJsonBody } = require("./_lib/http");
const { updateContactEmail } = require("./_lib/content");
const { getDatabase } = require("./_lib/mongo");

module.exports = async function handler(request, response) {
  try {
    if (handleCors(request, response, ["GET", "PUT"])) return;
    if (request.method === "GET") {
      const database = await getDatabase();
      const record = await database.collection("site_content").findOne({ _id: "current" });
      return jsonResponse(response, 200, { content: updateContactEmail(record?.content) || null });
    }

    if (request.method === "PUT") {
      const admin = await requireSiteAdmin(request);
      const body = readJsonBody(request);
      if (!body || !body.content || typeof body.content !== "object" || Array.isArray(body.content)) {
        return jsonResponse(response, 400, { error: "El contenido del sitio no es válido." });
      }

      const updatedAt = new Date();
      const database = await getDatabase();
      await database.collection("site_content").updateOne(
        { _id: "current" },
        { $set: { content: body.content, updated_by: admin.id, updated_at: updatedAt } },
        { upsert: true }
      );
      return jsonResponse(response, 200, { content: body.content, updated_at: updatedAt.toISOString() });
    }

    return allowMethods(response, ["GET", "PUT"]);
  } catch (error) {
    return handleError(response, error, "No se pudo cargar o guardar el contenido del sitio.");
  }
};
