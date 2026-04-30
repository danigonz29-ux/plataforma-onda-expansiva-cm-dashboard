import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCM, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status" aria-live="polite">
        <span className="sr-only">Validando sesión...</span>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" aria-hidden="true" />
      </div>
    );
  }

  if (!isAuthenticated || !isCM) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
