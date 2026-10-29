const { getSupabaseAdminClient, requireSiteAdmin } = require("./_lib/auth");
const { allowMethods, handleCors, handleError, jsonResponse, readJsonBody } = require("./_lib/http");

function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

module.exports = async function handler(request, response) {
  try {
    if (handleCors(request, response, ["GET", "POST"])) return;
    if (request.method !== "GET" && request.method !== "POST") {
      return allowMethods(response, ["GET", "POST"]);
    }

    const admin = await requireSiteAdmin(request);
    const supabase = getSupabaseAdminClient();
    if (request.method === "GET") {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, email, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return jsonResponse(response, 200, { admins: data });
    }

    const body = readJsonBody(request);
    if (!body) return jsonResponse(response, 400, { error: "El cuerpo JSON debe ser un objeto." });

    if (body.action === "create") {
      if (!validEmail(body.email)) return jsonResponse(response, 400, { error: "Escribe un correo electrónico válido." });
      if (typeof body.password !== "string" || body.password.length < 12) {
        return jsonResponse(response, 400, { error: "La contraseña debe tener al menos 12 caracteres." });
      }

      const email = body.email.trim().toLowerCase();
      const created = await supabase.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true
      });
      if (created.error) return jsonResponse(response, 400, { error: created.error.message });

      const { error } = await supabase.from("admin_users").insert({ id: created.data.user.id, email });
      if (error) {
        const rollback = await supabase.auth.admin.deleteUser(created.data.user.id);
        if (rollback.error) console.error("No se pudo revertir la nueva cuenta:", rollback.error);
        throw error;
      }
      return jsonResponse(response, 201, { admin: { id: created.data.user.id, email } });
    }

    if (body.action === "update-profile") {
      const updates = {};
      if (body.email !== undefined) {
        if (!validEmail(body.email)) return jsonResponse(response, 400, { error: "Escribe un correo electrónico válido." });
        updates.email = body.email.trim().toLowerCase();
        updates.email_confirm = true;
      }
      if (body.password !== undefined) {
        if (typeof body.password !== "string" || body.password.length < 12) {
          return jsonResponse(response, 400, { error: "La contraseña debe tener al menos 12 caracteres." });
        }
        updates.password = body.password;
      }
      if (!Object.keys(updates).length) {
        return jsonResponse(response, 400, { error: "Indica un correo o una contraseña nueva." });
      }

      const updated = await supabase.auth.admin.updateUserById(admin.id, updates);
      if (updated.error) return jsonResponse(response, 400, { error: updated.error.message });
      const email = updates.email || admin.email;
      const { error } = await supabase.from("admin_users").update({ email }).eq("id", admin.id);
      if (error) throw error;
      return jsonResponse(response, 200, { admin: { id: admin.id, email } });
    }

    if (body.action === "delete") {
      if (typeof body.id !== "string" || body.id === admin.id) {
        return jsonResponse(response, 400, { error: "No puedes eliminar tu propia cuenta desde esta acción." });
      }
      const { count, error: countError } = await supabase
        .from("admin_users")
        .select("id", { count: "exact", head: true });
      if (countError) throw countError;
      if ((count || 0) <= 1) {
        return jsonResponse(response, 409, { error: "Debe quedar al menos una cuenta administradora." });
      }
      const { data: target, error } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", body.id)
        .maybeSingle();
      if (error) throw error;
      if (!target) return jsonResponse(response, 404, { error: "No se encontró esa cuenta administradora." });
      const deleted = await supabase.auth.admin.deleteUser(body.id);
      if (deleted.error) throw deleted.error;
      return jsonResponse(response, 200, { message: "Cuenta administradora eliminada." });
    }

    return jsonResponse(response, 400, { error: "La acción de administración no es válida." });
  } catch (error) {
    return handleError(response, error, "No se pudo completar la operación administrativa.");
  }
};
