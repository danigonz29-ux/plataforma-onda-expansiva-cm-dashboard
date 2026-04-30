import { createContext } from "react";

export const AuthContext = createContext(null);

export const VISTA_TOKEN = import.meta.env.VITE_VISTA_TOKEN ?? "";

export const VISTA_USER = Object.freeze({
  email: "visualizador",
  id: "vista-token",
});
