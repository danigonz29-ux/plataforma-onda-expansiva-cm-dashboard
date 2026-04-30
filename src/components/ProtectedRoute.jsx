import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protege rutas que requieren estar autenticado como CM
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCM, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated || !isCM) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
