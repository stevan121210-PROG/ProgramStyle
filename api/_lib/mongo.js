const { MongoClient } = require("mongodb");
const { HttpError } = require("./http");

let clientPromise;

async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new HttpError(503, "MongoDB no está configurado. Añade MONGODB_URI en las variables de entorno del servidor.");
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 5000
    });
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }

  const client = await clientPromise;
  const databaseName = process.env.MONGODB_DB || "programstyle";
  return client.db(databaseName);
}

module.exports = { getDatabase };
