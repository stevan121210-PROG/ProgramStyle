const { MongoClient } = require("mongodb");

const PAGE_SIZE = 1000;
const MIGRATION_ID = "supabase-operational-data-v1";

function requiredEnvironment(...names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  throw new Error(`Falta configurar una variable requerida: ${names.join(" o ")}.`);
}

async function readSupabaseTable(baseUrl, serviceKey, table, columns, orderBy) {
  const records = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url = new URL(`/rest/v1/${table}`, baseUrl);
    url.searchParams.set("select", columns);
    if (orderBy) url.searchParams.set("order", orderBy);

    const response = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        "Range-Unit": "items"
      }
    });
    if (!response.ok) {
      throw new Error(`Supabase no permitió leer ${table} (HTTP ${response.status}).`);
    }
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`Supabase devolvió datos inválidos para ${table}.`);
    records.push(...page);
    if (page.length < PAGE_SIZE) return records;
  }
}

async function migrate() {
  const mongoUri = requiredEnvironment("MONGODB_URI");
  const databaseName = process.env.MONGODB_DB || "programstyle";
  const supabaseUrl = requiredEnvironment("SUPABASE_URL", "VITE_SUPABASE_URL").replace(/\/+$/, "");
  const serviceKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const database = client.db(databaseName);
    const migrations = database.collection("_migrations");
    if (await migrations.findOne({ _id: MIGRATION_ID })) {
      throw new Error("Esta migración ya se ejecutó. No se sobrescribieron datos.");
    }

    const [contentRecords, requests] = await Promise.all([
      readSupabaseTable(supabaseUrl, serviceKey, "site_content", "id,content,updated_by,updated_at", "id.asc"),
      readSupabaseTable(supabaseUrl, serviceKey, "contact_requests", "id,name,email,phone,service,message,status,created_at", "id.asc")
    ]);
    if (contentRecords.some(({ id }) => id !== 1)) {
      throw new Error("La tabla de contenido contiene un registro inesperado; revisa los datos antes de migrar.");
    }
    if (requests.some(({ id, created_at }) =>
      !Number.isSafeInteger(id) || !Number.isFinite(Date.parse(created_at))
    )) {
      throw new Error("Hay solicitudes con identificadores o fechas inválidos; se detuvo la migración.");
    }

    if (contentRecords.length) {
      const record = contentRecords[0];
      await database.collection("site_content").replaceOne(
        { _id: "current" },
        {
          _id: "current",
          content: record.content,
          updated_by: record.updated_by,
          updated_at: record.updated_at
        },
        { upsert: true }
      );
    }

    const requestsCollection = database.collection("contact_requests");
    if (requests.length) {
      await requestsCollection.bulkWrite(requests.map((record) => ({
        replaceOne: {
          filter: { _id: record.id },
          replacement: {
            _id: record.id,
            name: record.name,
            email: record.email,
            phone: record.phone,
            service: record.service,
            message: record.message,
            status: record.status,
            created_at: new Date(record.created_at)
          },
          upsert: true
        }
      })));
    }

    await migrations.insertOne({
      _id: MIGRATION_ID,
      completed_at: new Date(),
      site_content_count: contentRecords.length,
      contact_requests_count: requests.length
    });
    console.log(`Migración completada: ${contentRecords.length} registro(s) de contenido y ${requests.length} solicitud(es).`);
    console.log("No se borró ningún dato de Supabase. La tabla admin_users y las cuentas siguen en Supabase.");
  } finally {
    await client.close();
  }
}

migrate().catch((error) => {
  console.error("No se completó la migración a MongoDB:", error.message);
  process.exitCode = 1;
});
