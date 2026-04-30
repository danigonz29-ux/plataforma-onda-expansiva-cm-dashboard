import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const VISTA_TOKEN = import.meta.env.VITE_VISTA_TOKEN || "vista-onda-2026-token-secreto";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
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
          fetchUserRole(data.session.user.id);
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
        fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserRole = (userId) => {
    console.log("Fetching role for user:", userId);
    
    // Por ahora usamos rol por defecto para evitar bloqueos
    setRole("cm");
    console.log("Using default role: cm");
    
    // Query en background (no bloqueante)
    supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error obteniendo rol:", error);
          return;
        }
        console.log("Role fetched from DB:", data?.role);
        if (data?.role) {
          setRole(data.role);
        }
      })
      .catch((err) => {
        console.error("Error fetching role:", err);
      });
  };

  const login = async (email, password) => {
    setError("");
    console.log("Login attempt for:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        
        if (error.message.includes("Invalid login credentials")) {
          setError("Email o contraseña incorrectos.");
        } else {
          setError(error.message);
        }
        return { success: false, error: error.message };
      }

      console.log("Auth successful, user:", data.user.email);
      setUser(data.user);
      
      // Fetch role non-blocking
      fetchUserRole(data.user.id);

      console.log("Login complete, success: true");
      return { success: true };
    } catch (err) {
      console.error("Login exception:", err);
      const message = err.message || "Error al iniciar sesión";
      setError(message);
      return { success: false, error: message };
    }
  };

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