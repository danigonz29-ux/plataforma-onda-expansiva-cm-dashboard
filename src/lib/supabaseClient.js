import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name) {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

const supabaseUrl = getRequiredEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getRequiredEnv("VITE_SUPABASE_ANON_KEY");

try {
  new URL(supabaseUrl);
} catch {
  throw new Error("VITE_SUPABASE_URL no tiene formato de URL válido.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});
