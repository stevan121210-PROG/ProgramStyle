import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const useVercelApi = import.meta.env.MODE === "vercel" || import.meta.env.VITE_DATA_BACKEND === "vercel";

export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey
  ? new Error("Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para conectar el sitio con Supabase.")
  : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true
    }
  });

export async function invokeFunction(functionName, options = {}) {
  if (useVercelApi) {
    const headers = { Accept: "application/json" };
    if (supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    }

    const method = options.method || "POST";
    const requestOptions = { method, headers };
    if (options.body !== undefined && method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${window.location.origin}/api/${encodeURIComponent(functionName)}`, requestOptions);
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new Error(`El servidor devolvió una respuesta no válida (HTTP ${response.status}).`);
    }
    if (!response.ok) {
      throw new Error(data?.error || `Falló la solicitud (HTTP ${response.status}).`);
    }
    return data;
  }

  if (!supabase) throw supabaseConfigError;
  const { data, error } = await supabase.functions.invoke(functionName, options);
  if (error) {
    let message = error.message;
    if (error.context && typeof error.context.json === "function") {
      const details = await error.context.json().catch(() => null);
      if (typeof details?.error === "string") message = details.error;
    }
    throw new Error(message || `Falló la función ${functionName}.`);
  }
  return data;
}
