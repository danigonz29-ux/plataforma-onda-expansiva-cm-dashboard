import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Faltan variables de entorno de Supabase.\n" +
    "Asegúrate de tener en tu archivo .env.local:\n" +
    "  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n" +
    "  VITE_SUPABASE_ANON_KEY=eyJ...\n\n" +
    "Si estás en Vercel, agrégalas en Settings → Environment Variables."
  );
  throw new Error("Faltan variables de entorno de Supabase (VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY).");
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test de conexión (solo en desarrollo)
if (import.meta.env.DEV) {
  supabase
    .from("acciones")
    .select("id", { count: "exact", head: true })
    .then(({ count, error }) => {
      if (error) {
        console.warn(
          "⚠️ Supabase conectado pero error al consultar 'acciones':",
          error.message,
          "\n→ Verifica que la tabla exista y que RLS esté correctamente configurado."
        );
      } else {
        console.log(`✅ Supabase conectado. Tabla 'acciones': ${count ?? 0} registros.`);
      }
    });
}