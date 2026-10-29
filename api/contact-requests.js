const { ObjectId } = require("mongodb");
const { requireSiteAdmin } = require("./_lib/auth");
const { allowMethods, handleCors, handleError, jsonResponse, readJsonBody } = require("./_lib/http");
const { getDatabase } = require("./_lib/mongo");

function formatRequest(record) {
  return {
    id: String(record._id),
    name: record.name,
    email: record.email,
    phone: record.phone || null,
    service: record.service || null,
    message: record.message,
    status: record.status,
    created_at: record.created_at instanceof Date ? record.created_at.toISOString() : record.created_at
  };
}

function getRequestId(value) {
  if (typeof value !== "string" || !value) return null;
  if (/^\d+$/.test(value)) {
    const numericId = Number(value);
    return Number.isSafeInteger(numericId) ? numericId : null;
  }
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

module.exports = async function handler(request, response) {
  try {
    if (handleCors(request, response, ["GET", "POST"])) return;
    await requireSiteAdmin(request);
    const collection = (await getDatabase()).collection("contact_requests");

    if (request.method === "GET") {
      const records = await collection.find({}).sort({ created_at: -1 }).limit(100).toArray();
      return jsonResponse(response, 200, { requests: records.map(formatRequest) });
    }

    if (request.method === "POST") {
      const body = readJsonBody(request);
      const id = body && getRequestId(body.id);
      if (!body || id === null || !["new", "contacted"].includes(body.status)) {
        return jsonResponse(response, 400, { error: "La actualización de solicitud no es válida." });
      }
      const result = await collection.findOneAndUpdate(
        { _id: id },
        { $set: { status: body.status } },
        { returnDocument: "after" }
      );
      if (!result) return jsonResponse(response, 404, { error: "No se encontró esa solicitud." });
      return jsonResponse(response, 200, { request: { id: String(result._id), status: result.status } });
    }

    return allowMethods(response, ["GET", "POST"]);
  } catch (error) {
    return handleError(response, error, "No se pudieron gestionar las solicitudes.");
  }
};
