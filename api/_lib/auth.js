const { createClient } = require("@supabase/supabase-js");
const { HttpError } = require("./http");

let supabaseClient;

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new HttpError(503, "La autenticación administrativa no está configurada en el servidor.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabaseClient;
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function requireSiteAdmin(request) {
  const token = getBearerToken(request);
  if (!token) throw new HttpError(401, "Inicia sesión para continuar.");

  const supabase = getSupabaseAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new HttpError(401, "La sesión expiró. Inicia sesión de nuevo.");

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();
  if (adminError) throw new Error("No se pudo verificar el permiso administrativo.");
  if (!admin) throw new HttpError(403, "Esta cuenta no tiene permisos de administración.");
  return admin;
}

module.exports = { getBearerToken, getSupabaseAdminClient, requireSiteAdmin };
