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