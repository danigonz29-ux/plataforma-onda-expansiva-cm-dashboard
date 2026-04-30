import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext, VISTA_TOKEN, VISTA_USER } from "./authCore";

const CM_ROLE = "cm";

function getLoginErrorMessage(message = "") {
  if (message.includes("Invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }

  return message || "No se pudo iniciar sesión.";
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMountedRef = useRef(false);
  const roleRequestRef = useRef(0);
  const tokenSessionRef = useRef(false);

  const fetchUserRole = useCallback(async (userId) => {
    const { data, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (roleError) {
      throw roleError;
    }

    return data?.role ?? null;
  }, []);

  const syncSupabaseSession = useCallback(
    async (session) => {
      const requestId = roleRequestRef.current + 1;
      roleRequestRef.current = requestId;

      if (!session?.user) {
        if (!isMountedRef.current) return null;

        if (!tokenSessionRef.current) {
          setUser(null);
          setRole(null);
        }

        setLoading(false);
        return null;
      }

      tokenSessionRef.current = false;

      if (isMountedRef.current) {
        setLoading(true);
        setUser(session.user);
        setRole(null);
        setError("");
      }

      try {
        const nextRole = await fetchUserRole(session.user.id);

        if (isMountedRef.current && roleRequestRef.current === requestId) {
          setRole(nextRole);

          if (!nextRole) {
            setError("No encontramos un rol asociado a este usuario.");
          }
        }

        return nextRole;
      } catch (err) {
        const message = err?.message || "No se pudo obtener el rol del usuario.";

        if (isMountedRef.current && roleRequestRef.current === requestId) {
          setRole(null);
          setError(message);
        }

        return null;
      } finally {
        if (isMountedRef.current && roleRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [fetchUserRole]
  );

  useEffect(() => {
    isMountedRef.current = true;
    const scheduledSyncs = new Set();

    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (isMountedRef.current) {
            setError(sessionError.message);
            setLoading(false);
          }
          return;
        }

        await syncSupabaseSession(data?.session);
      } catch (err) {
        if (isMountedRef.current) {
          setError(err?.message || "No se pudo validar la sesión.");
          setLoading(false);
        }
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const syncId = setTimeout(() => {
        scheduledSyncs.delete(syncId);
        void syncSupabaseSession(session);
      }, 0);

      scheduledSyncs.add(syncId);
    });

    return () => {
      isMountedRef.current = false;
      roleRequestRef.current += 1;
      scheduledSyncs.forEach((syncId) => clearTimeout(syncId));
      subscription?.unsubscribe();
    };
  }, [syncSupabaseSession]);

  const login = useCallback(async (email, password) => {
    setError("");
    setLoading(true);
    tokenSessionRef.current = false;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const message = getLoginErrorMessage(error.message);

        setError(message);
        setLoading(false);
        return { success: false, error: message };
      }

      const nextRole = await syncSupabaseSession(data.session);

      if (nextRole !== CM_ROLE) {
        const message = "Tu usuario no tiene permisos de CM para esta plataforma.";

        setError(message);
        await supabase.auth.signOut();
        return { success: false, error: message };
      }

      return { success: true };
    } catch (err) {
      const message = err?.message || "Error al iniciar sesión";

      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  }, [syncSupabaseSession]);

  const loginWithToken = useCallback((token) => {
    if (VISTA_TOKEN && token === VISTA_TOKEN) {
      tokenSessionRef.current = true;
      roleRequestRef.current += 1;
      setError("");
      setLoading(false);
      setRole("visualizador");
      setUser(VISTA_USER);
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(async () => {
    setError("");
    roleRequestRef.current += 1;
    tokenSessionRef.current = false;

    if (user?.id === VISTA_USER.id) {
      setUser(null);
      setRole(null);
      setLoading(false);
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
      setError(err?.message || "No se pudo cerrar sesión.");
      return { success: false };
    }
  }, [user?.id]);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      error,
      login,
      loginWithToken,
      logout,
      isAuthenticated: !!user,
      isCM: role === CM_ROLE,
      isVisualizador: role === "visualizador",
    }),
    [error, loading, login, loginWithToken, logout, role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
