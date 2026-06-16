import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { VISTA_TOKEN } from "../context/authCore";
import Dashboard from "../components/Dashboard";

export default function VistaPage() {
  const { token } = useParams();
  const { loginWithToken } = useAuth();
  const accessToken = token || VISTA_TOKEN;
  const valid = token ? token === VISTA_TOKEN : Boolean(VISTA_TOKEN);

  useEffect(() => {
    if (valid) {
      loginWithToken(accessToken);
    }
  }, [accessToken, loginWithToken, valid]);

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

  return <Dashboard />;
}
