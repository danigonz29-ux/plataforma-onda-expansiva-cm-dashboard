import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth, VISTA_TOKEN } from "../context/AuthContext";
import Dashboard from "../components/Dashboard";

export default function VistaPage() {
  const { token } = useParams();
  const { loginWithToken, isAuthenticated, isVisualizador } = useAuth();
  const [valid, setValid] = useState(null); // null=loading, true=ok, false=invalid

  useEffect(() => {
    if (token) {
      const success = loginWithToken(token);
      setValid(success);
    } else {
      setValid(false);
    }
  }, [token]);

  // Cargando
  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Token inválido
  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Link Inválido</h1>
          <p className="text-slate-500 text-sm">
            El link de acceso no es válido o ha expirado. Solicita un nuevo link al equipo Onda Expansiva.
          </p>
        </div>
      </div>
    );
  }

  // Token válido → mostrar dashboard en modo visualizador
  return <Dashboard />;
}
