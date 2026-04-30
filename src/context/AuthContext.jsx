import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

// ⚠️ CAMBIA ESTE TOKEN por uno secreto que solo tú conozcas
// Puedes generarlo en: https://www.uuidgenerator.net/
// Ejemplo: "vista-onda-2026-xK9mP3qL7nR2"
export const VISTA_TOKEN = import.meta.env.VITE_VISTA_TOKEN || "vista-onda-2026-token-secreto";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // "cm" | "visualizador" | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error obteniendo sesión:", sessionError);
          setLoading(false);
          return;
        }

        if (data?.session?.user) {
          setUser(data.session.user);
          await fetchUserRole(data.session.user.id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error en checkSession:", err);
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error obteniendo rol:", error);
        setRole("cm");
        return;
      }

      setRole(data?.role || "cm");
    } catch (err) {
      console.error("Error fetching role:", err);
      setRole("cm");
    }
  };

  // Login para CM con email + contraseña
  const login = async (email, password) => {
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email o contraseña incorrectos.");
        } else {
          setError(error.message);
        }
        return { success: false, error: error.message };
      }

      setUser(data.user);
      await fetchUserRole(data.user.id);
      return { success: true };
    } catch (err) {
      const message = err.message || "Error al iniciar sesión";
      setError(message);
      return { success: false, error: message };
    }
  };

  // Acceso visualizador con token (sin auth)
  const loginWithToken = (token) => {
    if (token === VISTA_TOKEN) {
      setRole("visualizador");
      setUser({ email: "visualizador", id: "vista-token" });
      return true;
    }
    return false;
  };

  const logout = async () => {
    setError("");

    // Si es visualizador por token, solo limpiamos el estado
    if (user?.id === "vista-token") {
      setUser(null);
      setRole(null);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return { success: false };
      }
      setUser(null);
      setRole(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false };
    }
  };

  const value = {
    user,
    role,
    loading,
    error,
    login,
    loginWithToken,
    logout,
    isAuthenticated: !!user,
    isCM: role === "cm",
    isVisualizador: role === "visualizador",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
